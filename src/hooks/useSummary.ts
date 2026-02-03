import { AppConfig } from '@/src/constants/app-config';
import { useUI } from '@/src/contexts/UIContext';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { reportService } from '@/src/services/report-service';
import { WealthSummary, wealthService } from '@/src/services/wealth-service';
import { logger } from '@/src/utils/logger';
import { preferences } from '@/src/utils/preferences';
import { useEffect, useRef, useState } from 'react';

export interface DashboardSummaryData extends WealthSummary {
    income: number;
    expense: number;
    totalEquity: number;
    totalIncome: number;
    totalExpense: number;
    isPrivacyMode: boolean;
    isLoading: boolean;
    version: number;
    togglePrivacyMode: () => void;
}

/**
 * Hook for dashboard summary data with net worth, income, and expense
 *
 * Optimizations:
 * - Debounced recalculation (300ms) to prevent rapid re-renders
 * - Subscribes to accounts + transactions via repositories (not direct DB access)
 * - Filters out deleted records
 */
export const useSummary = () => {
    const { isPrivacyMode, setPrivacyMode } = useUI();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [data, setData] = useState<Omit<DashboardSummaryData, 'togglePrivacyMode' | 'isPrivacyMode'>>({
        income: 0,
        expense: 0,
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        totalEquity: 0,
        totalIncome: 0,
        totalExpense: 0,
        isLoading: true,
        version: 0,
    });

    const fetchSummary = async () => {
        try {
            const now = new Date();
            const month = now.getMonth();
            const year = now.getFullYear();
            const startOfMonth = new Date(year, month, 1).getTime();
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

            const targetCurrency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;

            const [monthly, balances] = await Promise.all([
                reportService.getIncomeVsExpense(startOfMonth, endOfMonth, targetCurrency),
                accountRepository.getAccountBalances()
            ]);

            const wealth = await wealthService.calculateSummary(balances, targetCurrency);

            setData(prev => ({
                income: monthly.income,
                expense: monthly.expense,
                ...wealth,
                isLoading: false,
                version: prev.version + 1,
            }));
        } catch (error) {
            logger.error('Failed to fetch summary:', error);
            setData(prev => ({ ...prev, isLoading: false, version: prev.version + 1 }));
        }
    };

    const togglePrivacyMode = () => setPrivacyMode(!isPrivacyMode);

    useEffect(() => {
        // Debounced calculation to match useNetWorth behavior
        const debouncedFetch = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(fetchSummary, 300);
        };

        // Initial load (immediate, no debounce)
        fetchSummary();

        // Subscribe to account changes via repository (not direct DB access)
        const accountSubscription = accountRepository
            .observeAll()
            .subscribe(debouncedFetch);

        // Subscribe to transaction changes via repository (not direct DB access)
        const transactionSubscription = transactionRepository
            .observeActive()
            .subscribe(debouncedFetch);

        return () => {
            accountSubscription.unsubscribe();
            transactionSubscription.unsubscribe();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        ...data,
        isPrivacyMode,
        togglePrivacyMode,
    };
};
