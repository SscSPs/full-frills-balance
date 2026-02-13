import { AppConfig } from '@/src/constants';
import { JournalListHeader } from '@/src/features/journal/components/JournalListHeader';
import { JournalListView } from '@/src/features/journal/components/JournalListView';
import { useJournalListViewModel } from '@/src/features/journal/hooks/useJournalListViewModel';
import React from 'react';

export function JournalListScreen() {
    const { strings } = AppConfig;
    const list = useJournalListViewModel({
        pageSize: 50,
        emptyState: {
            title: strings.journal.emptyTitle,
            subtitle: strings.journal.emptySubtitle
        }
    });

    const headerTitle = list.searchQuery ? strings.journal.searchResults : strings.journal.transactions;

    return (
        <JournalListView
            screenTitle={strings.journal.transactions}
            listHeader={(
                <JournalListHeader
                    title={headerTitle}
                    dateRange={list.dateRange}
                    onShowDatePicker={list.showDatePicker}
                    onNavigatePrevious={list.navigatePrevious}
                    onNavigateNext={list.navigateNext}
                    searchQuery={list.searchQuery}
                    onSearchChange={list.onSearchChange}
                />
            )}
            items={list.items}
            isLoading={list.isLoading}
            isLoadingMore={list.isLoadingMore}
            loadingText={list.loadingText}
            loadingMoreText={list.loadingMoreText}
            emptyTitle={list.emptyState.title}
            emptySubtitle={list.emptyState.subtitle}
            onEndReached={list.onEndReached}
            datePicker={{
                visible: list.isDatePickerVisible,
                onClose: list.hideDatePicker,
                currentFilter: list.periodFilter,
                onSelect: list.onDateSelect,
            }}
        />
    );
}
