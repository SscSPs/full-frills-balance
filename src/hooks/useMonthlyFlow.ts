import { AppConfig } from '@/src/constants/app-config';
import { useUI } from '@/src/contexts/UIContext';
import { useObservable } from '@/src/hooks/useObservable';
import { reactiveDataService } from '@/src/services/ReactiveDataService';

interface MonthlyFlow {
    income: number;
    expense: number;
}

/**
 * Specialized hook for monthly income and expense flow.
 * Now uses ReactiveDataService to eliminate duplicate subscriptions.
 */
export function useMonthlyFlow(): MonthlyFlow & { isLoading: boolean } {
    const { defaultCurrency } = useUI();
    const targetCurrency = defaultCurrency || AppConfig.defaultCurrency;

    const { data, isLoading } = useObservable<MonthlyFlow>(
        () => reactiveDataService.observeMonthlyFlow(targetCurrency),
        [targetCurrency],
        { income: 0, expense: 0 }
    );

    return {
        ...data,
        isLoading
    };
}
