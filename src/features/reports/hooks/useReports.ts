import { AppConfig } from '@/src/constants/app-config';
import { useTheme } from '@/src/hooks/use-theme';
import { DailyNetWorth, ExpenseCategory, reportService } from '@/src/services/report-service';
import { DateRange, PeriodFilter, getLastNRange } from '@/src/utils/dateUtils';
import { preferences } from '@/src/utils/preferences';
import { useEffect, useState } from 'react';

export function useReports() {
    const { theme } = useTheme();
    const [netWorthHistory, setNetWorthHistory] = useState<DailyNetWorth[]>([]);
    const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
    const [incomeVsExpense, setIncomeVsExpense] = useState<{ income: number, expense: number }>({ income: 0, expense: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
        type: 'LAST_N',
        lastN: 30,
        lastNUnit: 'days'
    });
    const [dateRange, setDateRange] = useState<DateRange>(getLastNRange(30, 'days'));

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { startDate, endDate } = dateRange;
            const targetCurrency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;

            const [history, breakdown, incVsExp] = await Promise.all([
                reportService.getNetWorthHistory(startDate, endDate, targetCurrency),
                reportService.getExpenseBreakdown(startDate, endDate, targetCurrency),
                reportService.getIncomeVsExpense(startDate, endDate, targetCurrency)
            ]);

            setNetWorthHistory(history);
            setIncomeVsExpense(incVsExp);

            // Assign colors to breakdown dynamically
            const colors = [
                theme.primary,
                theme.error,
                theme.success,
                theme.warning,
                theme.asset,
                theme.primaryLight
            ];
            setExpenses(breakdown.map((b, i) => ({ ...b, color: colors[i % colors.length] })));

        } catch (e) {
            setError(e instanceof Error ? e : new Error('Failed to load report data'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange.startDate, dateRange.endDate]);

    const updateFilter = (range: DateRange, filter: PeriodFilter) => {
        setDateRange(range);
        setPeriodFilter(filter);
    };

    return {
        netWorthHistory,
        expenses,
        incomeVsExpense,
        loading,
        error,
        dateRange,
        periodFilter,
        loadData,
        updateFilter
    };
}
