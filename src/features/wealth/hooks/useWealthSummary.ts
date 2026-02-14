import { Animation } from '@/src/constants'
import { AppConfig } from '@/src/constants/app-config'
import { useUI } from '@/src/contexts/UIContext'
import Account from '@/src/data/models/Account'
import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository'
import { journalRepository } from '@/src/data/repositories/JournalRepository'
import { transactionRepository } from '@/src/data/repositories/TransactionRepository'
import { useObservable } from '@/src/hooks/useObservable'
import { balanceService } from '@/src/services/BalanceService'
import { wealthService, WealthSummary } from '@/src/services/wealth-service'
import { AccountBalance } from '@/src/types/domain'
import { logger } from '@/src/utils/logger'
import { combineLatest, debounceTime, switchMap } from 'rxjs'

export interface WealthSummaryResult extends WealthSummary {
    accounts: Account[];
    balances: AccountBalance[];
    balancesMap: Map<string, AccountBalance>;
    isLoading: boolean;
    version: number;
}

const EMPTY_WEALTH_SUMMARY: Omit<WealthSummaryResult, 'isLoading' | 'version'> = {
    accounts: [] as Account[],
    balances: [] as AccountBalance[],
    balancesMap: new Map<string, AccountBalance>(),
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalIncome: 0,
    totalExpense: 0,
}

/**
 * useWealthSummary - Consolidated hook for net worth and account balances.
 * 
 * Replaces useNetWorth hooks previously scattered across the codebase.
 * Provides a single source of truth for wealth calculations.
 */
export function useWealthSummary(): WealthSummaryResult {
    const { defaultCurrency } = useUI()

    const { data, isLoading, version } = useObservable(
        () => combineLatest([
            accountRepository.observeAll(),
            transactionRepository.observeActiveWithColumns([
                'amount',
                'transaction_type',
                'transaction_date',
                'currency_code',
                'account_id',
                'exchange_rate',
                'updated_at'
            ]),
            currencyRepository.observeAll(),
            journalRepository.observeStatusMeta(),
        ]).pipe(
            debounceTime(Animation.dataRefreshDebounce),
            switchMap(async ([accounts]) => {
                try {
                    const targetCurrency = defaultCurrency || AppConfig.defaultCurrency

                    // Optimized Balance Fetching:
                    // balanceService.getAccountBalances() uses runningBalance caches 
                    // and parallel aggregateBalances logic.
                    const balances = await balanceService.getAccountBalances(Date.now(), targetCurrency)

                    // Calculate Wealth Summary from balances
                    const summary = await wealthService.calculateSummary(balances, targetCurrency)

                    const balancesMap = new Map(balances.map(b => [b.accountId, b]))

                    return {
                        accounts,
                        balances,
                        balancesMap,
                        ...summary,
                    }
                } catch (error) {
                    logger.error('Failed to calculate wealth summary:', error)
                    return EMPTY_WEALTH_SUMMARY
                }
            })
        ),
        [defaultCurrency],
        EMPTY_WEALTH_SUMMARY
    )

    return {
        ...data,
        isLoading,
        version
    }
}
