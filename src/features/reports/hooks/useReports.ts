import { AppConfig } from '@/src/constants/app-config';
import { REPORT_CHART_COLOR_KEYS } from '@/src/constants/report-constants';
import { useUI } from '@/src/contexts/UIContext';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { journalRepository } from '@/src/data/repositories/JournalRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { useTheme } from '@/src/hooks/use-theme';
import { useObservableWithEnrichment } from '@/src/hooks/useObservable';
import { reportService } from '@/src/services/report-service';
import { wealthService } from '@/src/services/wealth-service';
import { DateRange, PeriodFilter, getLastNRange } from '@/src/utils/dateUtils';
import { useCallback, useMemo, useState } from 'react';
import { combineLatest, map } from 'rxjs';

export function useReports() {
    const { theme } = useTheme();
    const { defaultCurrency } = useUI();
    const targetCurrency = defaultCurrency || AppConfig.defaultCurrency;

    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
        type: 'LAST_N',
        lastN: AppConfig.defaults.reportDays,
        lastNUnit: 'days'
    });
    const [dateRange, setDateRange] = useState<DateRange>(getLastNRange(AppConfig.defaults.reportDays, 'days'));

    const triggerObservable = useMemo(() => {
        return combineLatest([
            accountRepository.observeAll(),
            transactionRepository.observeByDateRangeWithColumns(
                dateRange.startDate,
                dateRange.endDate,
                [
                    'amount',
                    'transaction_type',
                    'transaction_date',
                    'deleted_at',
                    'account_id',
                    'journal_id',
                    'currency_code',
                    'exchange_rate'
                ]
            ),
            journalRepository.observeStatusMeta()
        ]).pipe(map(() => 0));
    }, [dateRange.startDate, dateRange.endDate]);

    const { data, isLoading: loading, error } = useObservableWithEnrichment(
        () => triggerObservable,
        async () => {
            const { startDate, endDate } = dateRange;

            const [history, reportSnapshot] = await Promise.all([
                wealthService.getNetWorthHistory(startDate, endDate, targetCurrency),
                reportService.getReportSnapshot(startDate, endDate, targetCurrency),
            ]);

            return {
                netWorthHistory: history,
                expenseBreakdown: reportSnapshot.expenseBreakdown,
                incomeBreakdown: reportSnapshot.incomeBreakdown,
                incomeVsExpenseHistory: reportSnapshot.incomeVsExpenseHistory,
                incomeVsExpense: reportSnapshot.incomeVsExpense,
                dailyIncomeVsExpense: reportSnapshot.dailyIncomeVsExpense,
            };
        },
        [dateRange, triggerObservable, defaultCurrency],
        {
            netWorthHistory: [],
            expenseBreakdown: [],
            incomeBreakdown: [],
            incomeVsExpenseHistory: [],
            incomeVsExpense: { income: 0, expense: 0 },
            dailyIncomeVsExpense: []
        }
    );

    const expenses = useMemo(() => {
        const colors = REPORT_CHART_COLOR_KEYS.expense.map((colorKey) => theme[colorKey]);
        return data.expenseBreakdown.map((b, i) => ({ ...b, color: colors[i % colors.length] }));
    }, [data.expenseBreakdown, theme]);

    const incomeBreakdown = useMemo(() => {
        const colors = REPORT_CHART_COLOR_KEYS.income.map((colorKey) => theme[colorKey]);
        return data.incomeBreakdown.map((b, i) => ({ ...b, color: colors[i % colors.length] }));
    }, [data.incomeBreakdown, theme]);

    const updateFilter = useCallback((range: DateRange, filter: PeriodFilter) => {
        setDateRange(range);
        setPeriodFilter(filter);
    }, []);

    return {
        netWorthHistory: data.netWorthHistory,
        expenses,
        incomeBreakdown,
        incomeVsExpenseHistory: data.incomeVsExpenseHistory,
        incomeVsExpense: data.incomeVsExpense,
        dailyIncomeVsExpense: data.dailyIncomeVsExpense,
        targetCurrency,
        loading,
        error,
        dateRange,
        periodFilter,
        updateFilter
    };
}
