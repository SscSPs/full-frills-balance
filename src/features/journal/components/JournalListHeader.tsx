import { FilterToolbar } from '@/src/components/common/FilterToolbar';
import { AppText } from '@/src/components/core';
import { Spacing } from '@/src/constants';
import { DateRange } from '@/src/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface JournalListHeaderProps {
    title: string;
    dateRange: DateRange | null;
    onShowDatePicker: () => void;
    onNavigatePrevious?: () => void;
    onNavigateNext?: () => void;
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

export function JournalListHeader({
    title,
    dateRange,
    onShowDatePicker,
    onNavigatePrevious,
    onNavigateNext,
    searchQuery,
    onSearchChange,
}: JournalListHeaderProps) {
    const [isSearching, setIsSearching] = React.useState(false);

    return (
        <View style={styles.headerContainer}>
            <View style={[styles.headerRow, isSearching && { gap: 0 }]}>
                {!isSearching && (
                    <AppText variant="subheading">
                        {title}
                    </AppText>
                )}
                <FilterToolbar
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    dateRange={dateRange}
                    showDatePicker={onShowDatePicker}
                    navigatePrevious={onNavigatePrevious}
                    navigateNext={onNavigateNext}
                    onSearchExpandChange={setIsSearching}
                    style={isSearching ? styles.expandedToolbar : undefined}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        marginBottom: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    expandedToolbar: {
        flex: 1,
    },
});
