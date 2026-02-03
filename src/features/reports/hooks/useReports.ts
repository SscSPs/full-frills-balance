import { AppConfig } from '@/src/constants/app-config';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { useTheme } from '@/src/hooks/use-theme';
import { useObservableWithEnrichment } from '@/src/hooks/useObservable';
import { DailyNetWorth, ExpenseCategory, reportService } from '@/src/services/report-service';
import { DateRange, PeriodFilter, getLastNRange } from '@/src/utils/dateUtils';
import { preferences } from '@/src/utils/preferences';
import { useCallback, useMemo, useState } from 'react';

export function useReports() {
    const { theme } = useTheme();
    const [netWorthHistory, setNetWorthHistory] = useState<DailyNetWorth[]>([]);
    const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseCategory[]>([]);
    const [incomeVsExpense, setIncomeVsExpense] = useState<{ income: number, expense: number }>({ income: 0, expense: 0 });

    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
        type: 'LAST_N',
        lastN: 30,
        lastNUnit: 'days'
    });
    const [dateRange, setDateRange] = useState<DateRange>(getLastNRange(30, 'days'));

    const triggerObservable = useMemo(() => {
        return transactionRepository.observeCountByDateRange(dateRange.startDate, dateRange.endDate);
    }, [dateRange.startDate, dateRange.endDate]);

    const { isLoading: loading, error, version } = useObservableWithEnrichment(
        () => triggerObservable,
        async () => {
            const { startDate, endDate } = dateRange;
            const targetCurrency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;

            const [history, breakdown, incVsExp] = await Promise.all([
                reportService.getNetWorthHistory(startDate, endDate, targetCurrency),
                reportService.getExpenseBreakdown(startDate, endDate, targetCurrency),
                reportService.getIncomeVsExpense(startDate, endDate, targetCurrency)
            ]);

            setNetWorthHistory(history);
            setIncomeVsExpense(incVsExp);
            setExpenseBreakdown(breakdown);
            return true;
        },
        [dateRange, triggerObservable],
        false
    );

    const expenses = useMemo(() => {
        const colors = [
            theme.primary,
            theme.error,
            theme.success,
            theme.warning,
            theme.asset,
            theme.primaryLight
        ];
        return expenseBreakdown.map((b, i) => ({ ...b, color: colors[i % colors.length] }));
    }, [expenseBreakdown, theme.asset, theme.error, theme.primary, theme.primaryLight, theme.success, theme.warning]);

    const updateFilter = useCallback((range: DateRange, filter: PeriodFilter) => {
        setDateRange(range);
        setPeriodFilter(filter);
    }, []);

    return {
        netWorthHistory,
        expenses,
        incomeVsExpense,
        loading,
        error,
        dateRange,
        periodFilter,
        updateFilter
    };
}
