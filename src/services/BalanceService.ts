import Account, { AccountType } from '@/src/data/models/Account';
import Transaction, { TransactionType } from '@/src/data/models/Transaction';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { exchangeRateService } from '@/src/services/exchange-rate-service';
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
    async calculateBalancesFromTransactions(
        accounts: Account[],
        transactions: Transaction[],
        precisionByCurrency: Map<string, number>,
        targetDefaultCurrency: string = 'USD',
        asOfDate: number = Date.now()
    ): Promise<Map<string, AccountBalance>> {
        const result = new Map<string, AccountBalance>();
        if (accounts.length === 0) return result;

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthTs = startOfMonth.getTime();

        const accountMap = new Map(accounts.map(account => [account.id, account]));
        const multiplierMap = new Map<string, { debit: number; credit: number }>();
        const accountPrecisionMap = new Map<string, number>();

        for (const account of accounts) {
            multiplierMap.set(account.id, {
                debit: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.DEBIT),
                credit: accountingService.getImpactMultiplier(account.accountType as AccountType, TransactionType.CREDIT),
            });
            accountPrecisionMap.set(account.id, precisionByCurrency.get(account.currencyCode) ?? 2);
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

            const precision = accountPrecisionMap.get(account.id) ?? 2;
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
        await this.aggregateBalances(accounts, result, accountPrecisionMap, targetDefaultCurrency);

        return result;
    }

    /**
     * Aggregates balances from child accounts to their parents.
     * Supports multi-level hierarchy.
     */
    private async aggregateBalances(
        accounts: Account[],
        balancesMap: Map<string, AccountBalance>,
        accountPrecisionMap: Map<string, number>,
        targetDefaultCurrency: string = 'USD'
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

        // 3. Track sub-tree currencies for each parent
        const subTreeCurrencies = new Map<string, Set<string>>();
        accounts.forEach(a => {
            const currencies = new Set<string>();
            const balance = balancesMap.get(a.id);
            if (balance && balance.transactionCount > 0) {
                currencies.add(balance.currencyCode);
            }
            subTreeCurrencies.set(a.id, currencies);
        });

        // 4. Propagate currency lists up the chain first
        accounts.forEach(account => {
            let currentParentId = parentIdMap.get(account.id);
            const myCurrencies = subTreeCurrencies.get(account.id);
            if (!myCurrencies) return;

            while (currentParentId) {
                const parentCurrencies = subTreeCurrencies.get(currentParentId);
                if (parentCurrencies) {
                    myCurrencies.forEach(c => parentCurrencies.add(c));
                }
                currentParentId = parentIdMap.get(currentParentId);
            }
        });

        // Aggregate balances using a leaf-to-root approach
        // To avoid double-counting, we only add a balance to its IMMEDIATE parent.
        // We iterate through levels starting from the deepest to ensure children are 
        // fully aggregated before they are added to their parents.

        // Build level map
        const levelMap = new Map<string, number>();
        const getLevel = (id: string): number => {
            if (levelMap.has(id)) return levelMap.get(id)!;
            const pid = parentIdMap.get(id);
            const level = pid ? getLevel(pid) + 1 : 0;
            levelMap.set(id, level);
            return level;
        };
        accounts.forEach(a => getLevel(a.id));

        // Sort accounts by depth (descending)
        const sortedAccounts = [...accounts].sort((a, b) => getLevel(b.id) - getLevel(a.id));

        for (const account of sortedAccounts) {
            const myBalance = balancesMap.get(account.id);
            if (!myBalance || (myBalance.balance === 0 && myBalance.transactionCount === 0)) continue;

            const parentId = parentIdMap.get(account.id);
            if (!parentId) continue; // Changed return to continue

            const parentBalance = balancesMap.get(parentId);
            if (parentBalance) {
                const precision = accountPrecisionMap.get(parentId) ?? 2; // Changed to accountPrecisionMap and parentId
                const pCurrencies = subTreeCurrencies.get(parentId);

                // Determine common target currency for this parent
                let targetCurrency = parentBalance.currencyCode;
                if (pCurrencies && pCurrencies.size === 1) {
                    // If all children are the same currency, adopt it (homogeneous subgroup)
                    targetCurrency = Array.from(pCurrencies)[0];
                } else if (pCurrencies && pCurrencies.size > 1) {
                    // If children are mixed, use the user's preferred default currency
                    targetCurrency = targetDefaultCurrency;
                }
                // FALLBACK: If parent has an explicit currency different from child, 
                // but child is unique, should we respect parent?
                // IvyWallet usually aggregates into the child's currency if it's a single-currency branch.
                // However, if the parent account object HAS a currencyCode that matches targetDefaultCurrency,
                // and children are different, we might want to convert.

                // Let's refine: if parent's own currency is different from the unique child currency, 
                // but matches the global target default, let's use the global target default.
                if (pCurrencies && pCurrencies.size === 1) {
                    const uniqueChildCurrency = Array.from(pCurrencies)[0];
                    if (parentBalance.currencyCode !== uniqueChildCurrency && parentBalance.currencyCode === targetDefaultCurrency) {
                        targetCurrency = targetDefaultCurrency;
                    }
                }

                // Update parent's display currency
                parentBalance.currencyCode = targetCurrency;

                // IMPORTANT: We only add to IMMEDIATE parent to avoid geometric growth.
                // The parent will eventually pass this total up to the grandparent.
                if (targetCurrency === myBalance.currencyCode) {
                    parentBalance.balance = roundToPrecision(parentBalance.balance + myBalance.balance, precision);
                } else {
                    // Convert child balance to parent target currency before adding
                    const { convertedAmount } = await exchangeRateService.convert(
                        myBalance.balance,
                        myBalance.currencyCode,
                        targetCurrency
                    );
                    parentBalance.balance = roundToPrecision(parentBalance.balance + convertedAmount, precision);

                    if (!parentBalance.childBalances) parentBalance.childBalances = [];
                    const existing = parentBalance.childBalances.find(cb => cb.currencyCode === myBalance.currencyCode);
                    if (existing) {
                        existing.balance = roundToPrecision(existing.balance + myBalance.balance, precision);
                    } else {
                        parentBalance.childBalances.push({
                            currencyCode: myBalance.currencyCode,
                            balance: myBalance.balance,
                            transactionCount: myBalance.transactionCount
                        });
                    }
                }

                // Also convert monthly stats for consistent parent totals
                if (targetCurrency === myBalance.currencyCode) {
                    parentBalance.monthlyIncome = roundToPrecision(parentBalance.monthlyIncome + myBalance.monthlyIncome, precision);
                    parentBalance.monthlyExpenses = roundToPrecision(parentBalance.monthlyExpenses + myBalance.monthlyExpenses, precision);
                } else {
                    const { convertedAmount: convIncome } = await exchangeRateService.convert(
                        myBalance.monthlyIncome,
                        myBalance.currencyCode,
                        targetCurrency
                    );
                    const { convertedAmount: convExpenses } = await exchangeRateService.convert(
                        myBalance.monthlyExpenses,
                        myBalance.currencyCode,
                        targetCurrency
                    );
                    parentBalance.monthlyIncome = roundToPrecision(parentBalance.monthlyIncome + convIncome, precision);
                    parentBalance.monthlyExpenses = roundToPrecision(parentBalance.monthlyExpenses + convExpenses, precision);
                }
            }
        }
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
    async getAccountBalances(asOfDate?: number, targetDefaultCurrency: string = 'USD'): Promise<AccountBalance[]> {
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

        this.aggregateBalances(accounts, balancesMap, precisionMap, targetDefaultCurrency);

        return Array.from(balancesMap.values());
    }
}

export const balanceService = new BalanceService();
