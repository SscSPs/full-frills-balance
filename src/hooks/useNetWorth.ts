import { AppConfig } from '@/src/constants/app-config';
import { useUI } from '@/src/contexts/UIContext';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { useObservable } from '@/src/hooks/useObservable';
import { balanceService } from '@/src/services/BalanceService';
import { WealthSummary, wealthService } from '@/src/services/wealth-service';
import { logger } from '@/src/utils/logger';
import { combineLatest, debounceTime, switchMap } from 'rxjs';

/**
 * Specialized hook for Net Worth and Wealth Summary.
 * Only subscribes to columns necessary for balance and wealth calculation.
 */
export function useNetWorth(): WealthSummary & { isLoading: boolean; version: number } {
    const { defaultCurrency } = useUI();

    const { data, isLoading, version } = useObservable<WealthSummary>(
        () => combineLatest([
            accountRepository.observeAll(),
            transactionRepository.observeActiveWithColumns([
                'amount',
                'account_id',
                'currency_code',
                'exchange_rate'
            ]),
            currencyRepository.observeAll()
        ]).pipe(
            debounceTime(300),
            switchMap(async ([accounts, transactions, currencies]) => {
                try {
                    const targetCurrency = defaultCurrency || AppConfig.defaultCurrency;
                    const precisionMap = new Map(currencies.map((currency) => [currency.code, currency.precision]));

                    const balancesMap = balanceService.calculateBalancesFromTransactions(accounts, transactions, precisionMap);
                    return await wealthService.calculateSummary(Array.from(balancesMap.values()), targetCurrency);
                } catch (error) {
                    logger.error('Failed to calculate net worth:', error);
                    return {
                        netWorth: 0,
                        totalAssets: 0,
                        totalLiabilities: 0,
                        totalEquity: 0,
                        totalIncome: 0,
                        totalExpense: 0,
                    };
                }
            })
        ),
        [defaultCurrency],
        {
            netWorth: 0,
            totalAssets: 0,
            totalLiabilities: 0,
            totalEquity: 0,
            totalIncome: 0,
            totalExpense: 0,
        }
    );

    return {
        ...data,
        isLoading,
        version
    };
}
