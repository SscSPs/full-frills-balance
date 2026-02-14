import Account, { AccountType } from '@/src/data/models/Account';
import Transaction, { TransactionType } from '@/src/data/models/Transaction';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { AccountBalance } from '@/src/types/domain';
import { accountingService } from '@/src/utils/accountingService';
import { roundToPrecision } from '@/src/utils/money';

export class BalanceService {
    /**
     * Pure calculation for a single account from an in-memory transaction list.
     * Intended for reactive hooks that already subscribe to transactions.
     */
    calculateAccountBalanceFromTransactions(
        account: Account,
        transactions: Transaction[],
        precision: number,
        asOfDate: number = Date.now()
    ): AccountBalance {
        let balance = 0;
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        let transactionCount = 0;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthTs = startOfMonth.getTime();

        const multiplierMap: Record<string, number> = {
            [TransactionType.DEBIT]: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.DEBIT),
            [TransactionType.CREDIT]: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.CREDIT)
        };

        for (const tx of transactions) {
            if (tx.accountId !== account.id) continue;
            transactionCount += 1;
            const multiplier = multiplierMap[tx.transactionType] || 0;
            const impact = tx.amount * multiplier;

            balance = roundToPrecision(balance + impact, precision);

            if (tx.transactionDate >= startOfMonthTs) {
                if (impact > 0) {
                    monthlyIncome = roundToPrecision(monthlyIncome + tx.amount, precision);
                } else if (impact < 0) {
                    monthlyExpenses = roundToPrecision(monthlyExpenses + tx.amount, precision);
                }
            }
        }

        return {
            accountId: account.id,
            balance,
            currencyCode: account.currencyCode,
            transactionCount,
            asOfDate,
            accountType: account.accountType as AccountType,
            monthlyIncome,
            monthlyExpenses
        };
    }

    /**
     * Pure calculation for multiple accounts from a shared transaction list.
     */
    calculateBalancesFromTransactions(
        accounts: Account[],
        transactions: Transaction[],
        precisionByCurrency: Map<string, number>,
        asOfDate: number = Date.now()
    ): Map<string, AccountBalance> {
        const result = new Map<string, AccountBalance>();
        if (accounts.length === 0) return result;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthTs = startOfMonth.getTime();

        const accountMap = new Map(accounts.map(account => [account.id, account]));
        const multiplierMap = new Map<string, { debit: number; credit: number }>();
        const precisionMap = new Map<string, number>();

        for (const account of accounts) {
            multiplierMap.set(account.id, {
                debit: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.DEBIT),
                credit: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.CREDIT),
            });
            precisionMap.set(account.id, precisionByCurrency.get(account.currencyCode) ?? 2);
            result.set(account.id, {
                accountId: account.id,
                balance: 0,
                currencyCode: account.currencyCode,
                transactionCount: 0,
                asOfDate,
                accountType: account.accountType as AccountType,
                monthlyIncome: 0,
                monthlyExpenses: 0
            });
        }

        for (const tx of transactions) {
            const account = accountMap.get(tx.accountId);
            if (!account) continue;

            const precision = precisionMap.get(account.id) ?? 2;
            const multipliers = multiplierMap.get(account.id);
            const multiplier = tx.transactionType === TransactionType.DEBIT ? multipliers?.debit : multipliers?.credit;
            const impact = tx.amount * (multiplier ?? 0);

            const current = result.get(account.id);
            if (!current) continue;

            current.balance = roundToPrecision(current.balance + impact, precision);
            current.transactionCount += 1;

            if (tx.transactionDate >= startOfMonthTs) {
                if (impact > 0) {
                    current.monthlyIncome = roundToPrecision(current.monthlyIncome + tx.amount, precision);
                } else if (impact < 0) {
                    current.monthlyExpenses = roundToPrecision(current.monthlyExpenses + tx.amount, precision);
                }
            }
        }

        // Aggregate child balances into parents
        this.aggregateBalances(accounts, result, precisionMap);

        return result;
    }

    /**
     * Aggregates balances from child accounts to their parents.
     * Supports multi-level hierarchy.
     */
    private aggregateBalances(
        accounts: Account[],
        balancesMap: Map<string, AccountBalance>,
        precisionMap: Map<string, number>
    ) {
        // 1. Build child-to-parent map
        const parentIdMap = new Map<string, string>();
        accounts.forEach(a => {
            if (a.parentAccountId) {
                parentIdMap.set(a.id, a.parentAccountId);
            }
        });

        // 2. Identify all accounts that are involved in a hierarchy
        // (Previously used involvedAccountIds here, now just propagate per account)

        // 3. For each account, if it has a parent, propagate its balance UP the chain
        // We do this by iterating through each account and climbing up its parent chain.
        // This ensures multi-level aggregation without complex recursion.
        accounts.forEach(account => {
            const originalBalance = balancesMap.get(account.id);
            if (!originalBalance || originalBalance.balance === 0) return;

            let currentParentId = parentIdMap.get(account.id);
            while (currentParentId) {
                const parentBalance = balancesMap.get(currentParentId);
                if (parentBalance) {
                    const precision = precisionMap.get(currentParentId) ?? 2;

                    if (parentBalance.currencyCode === originalBalance.currencyCode) {
                        // Same currency: Aggregate directly
                        parentBalance.balance = roundToPrecision(parentBalance.balance + originalBalance.balance, precision);
                        parentBalance.monthlyIncome = roundToPrecision(parentBalance.monthlyIncome + originalBalance.monthlyIncome, precision);
                        parentBalance.monthlyExpenses = roundToPrecision(parentBalance.monthlyExpenses + originalBalance.monthlyExpenses, precision);
                    } else {
                        // Different currency: Add to childBalances breakdown
                        if (!parentBalance.childBalances) {
                            parentBalance.childBalances = [];
                        }
                        const existing = parentBalance.childBalances.find(cb => cb.currencyCode === originalBalance.currencyCode);
                        if (existing) {
                            existing.balance = roundToPrecision(existing.balance + originalBalance.balance, precision);
                            existing.transactionCount += originalBalance.transactionCount;
                        } else {
                            parentBalance.childBalances.push({
                                currencyCode: originalBalance.currencyCode,
                                balance: originalBalance.balance,
                                transactionCount: originalBalance.transactionCount
                            });
                        }
                    }
                }
                currentParentId = parentIdMap.get(currentParentId);
            }
        });
    }

    /**
     * Returns an account's balance and transaction count as of a given date.
     * Logic migrated from AccountRepository to centralize balance management.
     * 
     * ⚠️ WARNING: DO NOT USE FOR UI. This is an imperative snapshot. 
     * Use `useAccountBalance` hook for reactive UI updates.
     */
    async getAccountBalance(
        accountId: string,
        cutoffDate: number = Date.now()
    ): Promise<AccountBalance> {
        const account = await accountRepository.find(accountId);
        if (!account) throw new Error(`Account ${accountId} not found`);

        const latestTx = await transactionRepository.findLatestForAccount(accountId, cutoffDate);

        if (!latestTx) {
            return {
                accountId: account.id,
                balance: 0,
                currencyCode: account.currencyCode,
                transactionCount: 0,
                asOfDate: cutoffDate,
                accountType: account.accountType as AccountType,
                monthlyIncome: 0,
                monthlyExpenses: 0
            };
        }

        // Note: monthlyIncome and monthlyExpenses are still best calculated 
        // via a targeted query or aggregation if needed. For now, we'll keep 
        // the snapshot logic primary.
        const txCount = await transactionRepository.getCountForAccount(accountId, cutoffDate);

        return {
            accountId: account.id,
            balance: latestTx.runningBalance || 0,
            currencyCode: account.currencyCode,
            transactionCount: txCount,
            asOfDate: cutoffDate,
            accountType: account.accountType as AccountType,
            // These would require additional aggregation if we want to be fully O(1)
            // but for simple save performance, balance is the primary bottleneck.
            monthlyIncome: 0,
            monthlyExpenses: 0
        };
    }

    /**
     * Gets balances for all active accounts in batch.
     */
    async getAccountBalances(asOfDate?: number): Promise<AccountBalance[]> {
        const accounts = await accountRepository.findAll();
        if (accounts.length === 0) return [];

        const cutoffDate = asOfDate ?? Date.now();

        const balancePromises = accounts.map(async (account): Promise<AccountBalance> => {
            const balanceData = await this.getAccountBalance(account.id, cutoffDate);
            return balanceData;
        });

        const balances = await Promise.all(balancePromises);
        const balancesMap = new Map(balances.map(b => [b.accountId, b]));
        const precisionMap = new Map<string, number>();

        // We need precision for rounding during aggregation. 
        // For efficiency in this batch call, we'll assume 2 or fetch if needed.
        // But since we already have accounts, we can build a better precision map.
        for (const account of accounts) {
            precisionMap.set(account.id, 2); // Default, ideally we'd have currency precisions
        }

        this.aggregateBalances(accounts, balancesMap, precisionMap);

        return Array.from(balancesMap.values());
    }
}

export const balanceService = new BalanceService();
