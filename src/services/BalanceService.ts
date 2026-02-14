import { AppConfig } from '@/src/constants/app-config';
import Account, { AccountType } from '@/src/data/models/Account';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { exchangeRateService } from '@/src/services/exchange-rate-service';
import { AccountBalance } from '@/src/types/domain';
import { roundToPrecision } from '@/src/utils/money';

export class BalanceService {
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

        // 2. Build cached depth calculator (used for both sorting and level mapping)
        const depthCache = new Map<string, number>();
        const getDepth = (id: string): number => {
            if (depthCache.has(id)) return depthCache.get(id)!;
            const pid = parentIdMap.get(id);
            const d = pid ? getDepth(pid) + 1 : 0;
            depthCache.set(id, d);
            return d;
        };

        // 3. Track sub-tree currencies for each parent to determine target currency
        const subTreeCurrencies = new Map<string, Set<string>>();
        accounts.forEach(a => {
            const currencies = new Set<string>();
            const balance = balancesMap.get(a.id);
            if (balance && (balance.balance !== 0 || balance.transactionCount > 0)) {
                currencies.add(balance.currencyCode);
            }
            subTreeCurrencies.set(a.id, currencies);
        });

        // 4. Propagate currency lists up the chain (deepest first)
        const sortedByDepthDesc = [...accounts].sort((a, b) => getDepth(b.id) - getDepth(a.id));

        for (const account of sortedByDepthDesc) {
            const parentId = parentIdMap.get(account.id);
            if (!parentId) continue;
            const myCurrencies = subTreeCurrencies.get(account.id);
            const parentCurrencies = subTreeCurrencies.get(parentId);
            if (myCurrencies && parentCurrencies) {
                myCurrencies.forEach(c => parentCurrencies.add(c));
            }
        }

        // 5. Group accounts by depth levels for parallel processing
        const levelMap = new Map<number, string[]>();
        let maxDepth = 0;

        accounts.forEach(a => {
            const d = getDepth(a.id);
            if (d > maxDepth) maxDepth = d;
            if (!levelMap.has(d)) levelMap.set(d, []);
            levelMap.get(d)!.push(a.id);
        });

        // 6. Aggregate leaf-to-root, level by level
        for (let d = maxDepth; d > 0; d--) {
            const accountIdsAtLevel = levelMap.get(d) || [];

            // Collect all required conversions for this level
            const conversionPromises: Promise<any>[] = [];

            for (const accountId of accountIdsAtLevel) {
                const parentId = parentIdMap.get(accountId);
                if (!parentId) continue;

                const myBalance = balancesMap.get(accountId);
                const parentBalance = balancesMap.get(parentId);
                if (!myBalance || !parentBalance || (myBalance.balance === 0 && myBalance.transactionCount === 0)) continue;

                const pCurrencies = subTreeCurrencies.get(parentId);
                let targetCurrency = parentBalance.currencyCode;

                if (pCurrencies && pCurrencies.size === 1) {
                    targetCurrency = Array.from(pCurrencies)[0] || parentBalance.currencyCode;
                } else if (pCurrencies && pCurrencies.size > 1) {
                    targetCurrency = targetDefaultCurrency;
                }

                parentBalance.currencyCode = targetCurrency;

                // Conversion Logic
                const processConversion = async () => {
                    const precision = accountPrecisionMap.get(parentId) ?? AppConfig.defaultCurrencyPrecision;
                    let amountToAdd = myBalance.balance;
                    let incomeToAdd = myBalance.monthlyIncome;
                    let expensesToAdd = myBalance.monthlyExpenses;

                    if (myBalance.currencyCode !== targetCurrency) {
                        const [balanceConv, incomeConv, expenseConv] = await Promise.all([
                            exchangeRateService.convert(myBalance.balance, myBalance.currencyCode, targetCurrency),
                            exchangeRateService.convert(myBalance.monthlyIncome, myBalance.currencyCode, targetCurrency),
                            exchangeRateService.convert(myBalance.monthlyExpenses, myBalance.currencyCode, targetCurrency),
                        ]);
                        amountToAdd = balanceConv.convertedAmount;
                        incomeToAdd = incomeConv.convertedAmount;
                        expensesToAdd = expenseConv.convertedAmount;

                        // Track mixed child balances for UI "Multi-currency" indicator
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

                    parentBalance.balance = roundToPrecision(parentBalance.balance + amountToAdd, precision);
                    parentBalance.monthlyIncome = roundToPrecision(parentBalance.monthlyIncome + incomeToAdd, precision);
                    parentBalance.monthlyExpenses = roundToPrecision(parentBalance.monthlyExpenses + expensesToAdd, precision);
                };

                conversionPromises.push(processConversion());
            }

            // Await all parallel conversions for this level before moving to the parent level
            await Promise.all(conversionPromises);
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

        const txCount = await transactionRepository.getCountForAccount(accountId, cutoffDate);

        return {
            accountId: account.id,
            balance: latestTx.runningBalance || 0,
            currencyCode: account.currencyCode,
            transactionCount: txCount,
            asOfDate: cutoffDate,
            accountType: account.accountType as AccountType,
            // Monthly stats are still 0 here as we rely on full re-scan for those in useAccountBalances
            // or we could implement a targeted query if needed.
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
        for (const account of accounts) precisionMap.set(account.id, AppConfig.defaultCurrencyPrecision); // Default precision from config

        await this.aggregateBalances(accounts, balancesMap, precisionMap, targetDefaultCurrency);

        return Array.from(balancesMap.values());
    }
}

export const balanceService = new BalanceService();
