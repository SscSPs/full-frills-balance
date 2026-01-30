
import { DonutChart } from '@/src/components/charts/DonutChart';
import { LineChart } from '@/src/components/charts/LineChart';
import { DateRangePicker } from '@/src/components/common/DateRangePicker';
import { AppCard, AppIcon, AppText } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Spacing } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import { DailyNetWorth, ExpenseCategory, reportService } from '@/src/services/report-service';
import { CurrencyFormatter } from '@/src/utils/currencyFormatter';
import { DateRange, PeriodFilter, formatDate, getLastNRange } from '@/src/utils/dateUtils';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ReportsScreen() {
    const { theme } = useTheme();
    const [netWorthHistory, setNetWorthHistory] = useState<DailyNetWorth[]>([]);
    const [expenses, setExpenses] = useState<ExpenseCategory[]>([]);
    const [incomeVsExpense, setIncomeVsExpense] = useState<{ income: number, expense: number }>({ income: 0, expense: 0 });
    const [loading, setLoading] = useState(true);

    // Filters
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>({
        type: 'LAST_N',
        lastN: 30,
        lastNUnit: 'days'
    });
    const [dateRange, setDateRange] = useState<DateRange>(getLastNRange(30, 'days'));

    useEffect(() => {
        loadData();
    }, [dateRange.startDate, dateRange.endDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = dateRange;

            const history = await reportService.getNetWorthHistory(startDate, endDate);
            const breakdown = await reportService.getExpenseBreakdown(startDate, endDate);
            const incVsExp = await reportService.getIncomeVsExpense(startDate, endDate);

            setNetWorthHistory(history);
            setIncomeVsExpense(incVsExp);

            // Assign colors to breakdown dynamically if not set
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
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDateSelect = (range: DateRange | null, filter: PeriodFilter) => {
        if (range) {
            setDateRange(range);
            setPeriodFilter(filter);
        }
        setShowDatePicker(false);
    };

    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].netWorth : 0;

    return (
        <Screen title="Reports" showBack={false}>
            {/* Header Filter Bar */}
            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={[styles.filterButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <AppIcon name="calendar" size={16} color={theme.textSecondary} />
                    <AppText variant="caption" style={{ marginLeft: Spacing.xs }}>
                        {dateRange.label || `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
                    </AppText>
                    <AppIcon name="chevronDown" size={16} color={theme.textSecondary} style={{ marginLeft: Spacing.xs }} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={loadData} tintColor={theme.primary} />
                }
            >
                <AppCard style={styles.chartCard} padding="lg">
                    <View style={styles.headerRow}>
                        <View>
                            <AppText variant="caption" color="secondary">NET WORTH CHANGE</AppText>
                            <AppText variant="heading">
                                {CurrencyFormatter.formatWithPreference(currentNetWorth)}
                            </AppText>
                        </View>
                        {/* Removed duplicate refresh button as we have pull-to-refresh and DatePicker acts as update trigger */}
                    </View>

                    <View style={styles.chartContainer}>
                        <LineChart
                            data={netWorthHistory.map(d => ({ x: d.date, y: d.netWorth }))}
                            height={180}
                            color={theme.primary}
                        />
                    </View>
                </AppCard>

                <AppText variant="subheading" style={styles.sectionTitle}>Spending Breakdown</AppText>

                {/* Income vs Expense Summary */}
                <AppCard style={styles.chartCard} padding="lg">
                    <View style={styles.balanceRow}>
                        <View style={styles.balanceItem}>
                            <AppText variant="caption" color="secondary">TOTAL INCOME</AppText>
                            <AppText variant="subheading" style={{ color: theme.success }}>
                                {CurrencyFormatter.formatWithPreference(incomeVsExpense.income)}
                            </AppText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.balanceItem}>
                            <AppText variant="caption" color="secondary">TOTAL EXPENSE</AppText>
                            <AppText variant="subheading" style={{ color: theme.error }}>
                                {CurrencyFormatter.formatWithPreference(incomeVsExpense.expense)}
                            </AppText>
                        </View>
                    </View>
                    <View style={styles.barContainer}>
                        <View style={[styles.bar, { flex: incomeVsExpense.income || 1, backgroundColor: theme.success }]} />
                        <View style={{ width: 4 }} />
                        <View style={[styles.bar, { flex: incomeVsExpense.expense || 1, backgroundColor: theme.error }]} />
                    </View>
                </AppCard>

                {expenses.length > 0 ? (
                    <AppCard style={styles.chartCard} padding="lg">
                        <View style={styles.donutContainer}>
                            <DonutChart
                                data={expenses.map(e => ({ value: e.amount, color: e.color || theme.text, label: e.accountName }))}
                                size={160}
                                strokeWidth={25}
                            />
                            <View style={styles.legend}>
                                {expenses.slice(0, 5).map((e, index) => (
                                    <View key={e.accountId} style={styles.legendItem}>
                                        <View style={[styles.dot, { backgroundColor: e.color }]} />
                                        <View style={{ flex: 1, marginRight: Spacing.sm }}>
                                            <AppText variant="caption" numberOfLines={1}>{e.accountName}</AppText>
                                        </View>
                                        <AppText variant="body" weight="bold">{Math.round(e.percentage)}%</AppText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </AppCard>
                ) : (
                    <AppCard padding="lg">
                        <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
                            No expense data for this period.
                        </AppText>
                    </AppCard>
                )}

            </ScrollView>

            <DateRangePicker
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={handleDateSelect}
                currentFilter={periodFilter}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    filterBar: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    chartCard: {
        marginBottom: Spacing.xl,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    chartContainer: {
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    donutContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legend: {
        flex: 1,
        marginLeft: Spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.sm,
    },
    balanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    balanceItem: {
        flex: 1,
    },
    divider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: Spacing.md,
    },
    barContainer: {
        flexDirection: 'row',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        borderRadius: 4,
    }
});
