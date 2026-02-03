/**
 * Integrity Service
 * 
 * Handles balance verification and crash recovery.
 * Ensures data integrity by detecting and repairing stale running balances.
 * This service is responsible for checking if the account balances match the transaction history.
 * 
 * All database writes are delegated to repositories.
 */

import { database } from '@/src/data/database/Database'
import Account, { AccountType } from '@/src/data/models/Account'
import Transaction from '@/src/data/models/Transaction'
import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository'
import { transactionRepository } from '@/src/data/repositories/TransactionRepository'
import { accountingService } from '@/src/utils/accountingService'
import { logger } from '@/src/utils/logger'
import { amountsAreEqual, roundToPrecision } from '@/src/utils/money'
import { ACTIVE_JOURNAL_STATUSES } from '@/src/utils/journalStatus'
import { Q } from '@nozbe/watermelondb'

export interface BalanceVerificationResult {
    accountId: string
    accountName: string
    cachedBalance: number
    computedBalance: number
    matches: boolean
    discrepancy: number
}

export interface IntegrityCheckResult {
    totalAccounts: number
    accountsChecked: number
    discrepanciesFound: number
    repairsAttempted: number
    repairsSuccessful: number
    results: BalanceVerificationResult[]
}

interface DefaultAccountData {
    name: string
    accountType: AccountType
    currencyCode: string
}

const DEFAULT_CURRENCY = 'USD'

const DEFAULT_EXPENSE_CATEGORIES: DefaultAccountData[] = [
    { name: 'Food', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Transport', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Shopping', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Entertainment', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Health', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Housing', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
    { name: 'Other Expense', accountType: AccountType.EXPENSE, currencyCode: DEFAULT_CURRENCY },
]

const DEFAULT_INCOME_CATEGORIES: DefaultAccountData[] = [
    { name: 'Salary', accountType: AccountType.INCOME, currencyCode: DEFAULT_CURRENCY },
    { name: 'Gifts', accountType: AccountType.INCOME, currencyCode: DEFAULT_CURRENCY },
    { name: 'Interest', accountType: AccountType.INCOME, currencyCode: DEFAULT_CURRENCY },
    { name: 'Other Income', accountType: AccountType.INCOME, currencyCode: DEFAULT_CURRENCY },
]

const DEFAULT_ASSET_ACCOUNTS: DefaultAccountData[] = [
    { name: 'Wallet', accountType: AccountType.ASSET, currencyCode: DEFAULT_CURRENCY },
]

export class IntegrityService {
    /**
     * Computes account balance from scratch by iterating all transactions.
     */
    async computeBalanceFromTransactions(accountId: string, cutoffDate?: number): Promise<number> {
        const account = await accountRepository.find(accountId)
        if (!account) {
            throw new Error(`Account ${accountId} not found`)
        }

        let query = database.collections.get<Transaction>('transactions')
            .query(
                Q.where('account_id', accountId),
                Q.where('deleted_at', Q.eq(null)),
                Q.on('journals', Q.and(
                    Q.where('status', Q.oneOf(ACTIVE_JOURNAL_STATUSES)),
                    Q.where('deleted_at', Q.eq(null))
                ))
            )

        if (cutoffDate !== undefined) {
            query = query.extend(Q.where('transaction_date', Q.lte(cutoffDate)))
        }

        const transactions = await query.fetch()
        const precision = await currencyRepository.getPrecision(account.currencyCode)

        let balance = 0
        for (const tx of transactions) {
            const multiplier = accountingService.getImpactMultiplier(account.accountType as any, tx.transactionType)
            balance = roundToPrecision(balance + (tx.amount * multiplier), precision)
        }

        return balance
    }

    /**
     * Verifies a single account's balance.
     */
    async verifyAccountBalance(accountId: string, cutoffDate: number = Date.now()): Promise<BalanceVerificationResult> {
        const account = await accountRepository.find(accountId)
        if (!account) {
            throw new Error(`Account ${accountId} not found`)
        }

        const cachedData = await accountRepository.getAccountBalance(accountId, cutoffDate)
        const computedBalance = await this.computeBalanceFromTransactions(accountId, cutoffDate)
        const precision = await currencyRepository.getPrecision(account.currencyCode)
        const discrepancy = Math.abs(cachedData.balance - computedBalance)

        return {
            accountId,
            accountName: account.name,
            cachedBalance: cachedData.balance,
            computedBalance,
            matches: amountsAreEqual(cachedData.balance, computedBalance, precision),
            discrepancy,
        }
    }

    /**
     * Verifies all account balances.
     */
    async verifyAllAccountBalances(): Promise<BalanceVerificationResult[]> {
        const accounts = await database.collections.get<Account>('accounts')
            .query(Q.where('deleted_at', Q.eq(null)))
            .fetch()

        const results: BalanceVerificationResult[] = []

        for (const account of accounts) {
            try {
                const result = await this.verifyAccountBalance(account.id)
                results.push(result)
            } catch (error) {
                logger.error(`[IntegrityService] Failed to verify account ${account.id}`, error)
            }
        }

        return results
    }

    /**
     * Repairs a single account's running balances.
     */
    async repairAccountBalance(accountId: string): Promise<boolean> {
        try {
            await transactionRepository.rebuildRunningBalances(accountId)
            logger.info(`[IntegrityService] Repaired running balances for account ${accountId}`)
            return true
        } catch (error) {
            logger.error(`[IntegrityService] Failed to repair account ${accountId}`, error)
            return false
        }
    }

    /**
     * Runs startup integrity check and seeds defaults if database is empty.
     */
    async runStartupCheck(): Promise<IntegrityCheckResult> {
        logger.info('[IntegrityService] Starting startup integrity check...')

        const accountsExist = await accountRepository.exists()

        if (!accountsExist) {
            logger.info('[IntegrityService] No accounts found. Seeding default accounts/categories...')
            await this.seedDefaultAccounts()
        }

        const results = await this.verifyAllAccountBalances()
        const discrepancies = results.filter(r => !r.matches)

        let repairsAttempted = 0
        let repairsSuccessful = 0

        for (const discrepancy of discrepancies) {
            logger.warn(
                `[IntegrityService] Balance discrepancy for ${discrepancy.accountName}: ` +
                `cached=${discrepancy.cachedBalance}, computed=${discrepancy.computedBalance}`
            )

            repairsAttempted++
            const success = await this.repairAccountBalance(discrepancy.accountId)
            if (success) {
                repairsSuccessful++
            }
        }

        const summary: IntegrityCheckResult = {
            totalAccounts: results.length,
            accountsChecked: results.length,
            discrepanciesFound: discrepancies.length,
            repairsAttempted,
            repairsSuccessful,
            results,
        }

        return summary
    }

    /**
     * Factory Reset.
     */
    async resetDatabase(options?: { seedDefaults?: boolean }): Promise<void> {
        logger.warn('[IntegrityService] STARTING FACTORY RESET...')
        try {
            await database.write(async () => {
                await database.unsafeResetDatabase()
            })
            const shouldSeed = options?.seedDefaults !== false
            if (shouldSeed) {
                logger.info('[IntegrityService] Database reset successful. Seeding defaults...')
                await this.seedDefaultAccounts()
            } else {
                logger.info('[IntegrityService] Database reset successful. Skipping default seed...')
            }
        } catch (error) {
            logger.error('[IntegrityService] CRITICAL: Factory reset failed:', error)
            throw error
        }
    }

    /**
     * Seeds default accounts and categories via repository.
     */
    async seedDefaultAccounts(): Promise<void> {
        const allDefaults = [
            ...DEFAULT_EXPENSE_CATEGORIES,
            ...DEFAULT_INCOME_CATEGORIES,
            ...DEFAULT_ASSET_ACCOUNTS,
        ]

        await accountRepository.seedDefaults(allDefaults)

        logger.info(`[IntegrityService] Seeded ${allDefaults.length} default accounts and categories.`)
    }

    /**
     * Data Cleanup.
     */
    async cleanupDatabase(): Promise<{ deletedCount: number }> {
        logger.info('[IntegrityService] Starting database cleanup...')
        let totalDeleted = 0
        const collections = ['journals', 'transactions', 'accounts']

        try {
            await database.write(async () => {
                for (const table of collections) {
                    const deletedRecords = await database.collections.get(table)
                        .query(Q.where('deleted_at', Q.notEq(null)))
                        .fetch()

                    totalDeleted += deletedRecords.length
                    for (const record of deletedRecords) {
                        await record.destroyPermanently()
                    }
                }
            })
            logger.info(`[IntegrityService] Cleanup complete. Removed ${totalDeleted} records.`)
        } catch (error) {
            logger.error('[IntegrityService] Cleanup failed:', error)
            throw error
        }

        return { deletedCount: totalDeleted }
    }
}

export const integrityService = new IntegrityService()
