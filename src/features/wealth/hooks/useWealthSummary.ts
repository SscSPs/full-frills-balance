import { AppConfig } from '@/src/constants/app-config';
import { useUI } from '@/src/contexts/UIContext';
import { useObservable } from '@/src/hooks/useObservable';
import { reactiveDataService } from '@/src/services/ReactiveDataService';
import { WealthSummary } from '@/src/services/wealth-service';

export interface WealthSummaryResult extends WealthSummary {
    isLoading: boolean;
    version: number;
}

const EMPTY_WEALTH_SUMMARY: Omit<WealthSummaryResult, 'isLoading' | 'version'> = {
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
    totalIncome: 0,
    totalExpense: 0,
};

/**
 * useWealthSummary - Consolidated hook for net worth and wealth metrics.
 * 
 * Now uses ReactiveDataService to eliminate duplicate subscriptions.
 * Provides a single source of truth for wealth calculations.
 */
export function useWealthSummary(): WealthSummaryResult {
    const { defaultCurrency } = useUI();
    const targetCurrency = defaultCurrency || AppConfig.defaultCurrency;

    const { data, isLoading, version } = useObservable(
        () => reactiveDataService.observeDashboardData(targetCurrency),
        [targetCurrency],
        {
            accounts: [],
            transactions: [],
            balances: [],
            wealthSummary: EMPTY_WEALTH_SUMMARY,
        }
    );

    return {
        ...data.wealthSummary,
        isLoading,
        version,
    };
}
