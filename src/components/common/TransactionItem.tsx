import { BaseTransactionCard } from '@/src/components/common/BaseTransactionCard';
import { useTheme } from '@/src/hooks/use-theme';
import { EnrichedTransaction, JournalDisplayType } from '@/src/types/domain';
import { journalPresenter } from '@/src/utils/journalPresenter';
import React, { memo, useCallback, useMemo } from 'react';

interface TransactionItemProps {
    transaction: EnrichedTransaction;
    onPress?: (transaction: EnrichedTransaction) => void;
}

/**
 * TransactionItem - Premium card component for individual transaction legs
 * Uses BaseTransactionCard for a unified IvyWallet aesthetic.
 */
export const TransactionItem = ({ transaction, onPress }: TransactionItemProps) => {
    const { theme } = useTheme();

    const displayAccounts = useMemo(() => {
        const accounts = [
            {
                id: transaction.accountId,
                name: transaction.accountName || 'Unknown',
                accountType: transaction.accountType || 'ASSET'
            }
        ];

        if (transaction.counterAccountType) {
            // Categories/Counter-accounts are shown first
            accounts.unshift({
                id: 'counter',
                name: transaction.counterAccountName || transaction.counterAccountType,
                accountType: transaction.counterAccountType
            });
        }

        return accounts;
    }, [transaction]);

    const presentation = useMemo(() => {
        const displayType = transaction.displayType as JournalDisplayType;
        const base = journalPresenter.getPresentation(displayType, theme, transaction.semanticLabel);
        const isIncrease = transaction.isIncrease;

        return {
            label: base.label,
            typeColor: base.colorHex,
            typeIcon: isIncrease ? 'arrowUp' : 'arrowDown',
            amountPrefix: isIncrease ? '+ ' : '− ',
        };
    }, [theme, transaction.displayType, transaction.isIncrease, transaction.semanticLabel]);

    const handlePress = useCallback(() => {
        onPress?.(transaction);
    }, [onPress, transaction]);

    return (
        <BaseTransactionCard
            title={transaction.journalDescription || transaction.displayTitle || 'Transaction'}
            amount={transaction.amount}
            currencyCode={transaction.currencyCode}
            transactionDate={transaction.transactionDate}
            presentation={presentation}
            accounts={displayAccounts}
            notes={transaction.notes}
            onPress={onPress ? handlePress : undefined}
        />
    );
};

export const MemoizedTransactionItem = memo(TransactionItem);
