import { BaseTransactionCard } from '@/src/components/common/BaseTransactionCard';
import { IconName } from '@/src/components/core';
import { EnrichedJournal, JournalDisplayType } from '@/src/types/domain';
import { useTheme } from '@/src/hooks/use-theme';
import { journalPresenter } from '@/src/utils/journalPresenter';
import React, { memo, useCallback } from 'react';

interface JournalCardProps {
    journal: EnrichedJournal;
    onPress: (journal: EnrichedJournal) => void;
}

/**
 * JournalCard - Displays a journal entry card
 * Uses BaseTransactionCard for consistency and simplicity.
 */
export const JournalCard = ({ journal, onPress }: JournalCardProps) => {
    const { theme } = useTheme();
    const displayType = journal.displayType as JournalDisplayType;
    const presentation = journalPresenter.getPresentation(displayType, theme, journal.semanticLabel);

    let typeIcon: IconName = 'document';
    let amountPrefix = '';
    if (displayType === JournalDisplayType.INCOME) {
        typeIcon = 'arrowUp';
        amountPrefix = '+ ';
    } else if (displayType === JournalDisplayType.EXPENSE) {
        typeIcon = 'arrowDown';
        amountPrefix = '− ';
    } else if (displayType === JournalDisplayType.TRANSFER) {
        typeIcon = 'swapHorizontal';
    }

    const handlePress = useCallback(() => {
        onPress(journal);
    }, [onPress, journal]);

    return (
        <BaseTransactionCard
            title={journal.description || (journal.displayType === JournalDisplayType.TRANSFER ? 'Transfer' : 'Transaction')}
            amount={journal.totalAmount}
            currencyCode={journal.currencyCode}
            transactionDate={journal.journalDate}
            presentation={{
                label: presentation.label,
                typeColor: presentation.colorHex,
                typeIcon,
                amountPrefix,
            }}
            accounts={journal.accounts as any}
            onPress={handlePress}
        />
    );
};

export const MemoizedJournalCard = memo(JournalCard);
