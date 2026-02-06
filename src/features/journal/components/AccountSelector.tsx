import { AppText, ListRow } from '@/src/components/core';
import { Shape, Spacing } from '@/src/constants';
import Account from '@/src/data/models/Account';
import { useTheme } from '@/src/hooks/use-theme';
import { journalPresenter } from '@/src/utils/journalPresenter';
import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccountSelectorProps {
    visible: boolean;
    accounts: Account[];
    selectedId?: string;
    onClose: () => void;
    onSelect: (accountId: string) => void;
}

export function AccountSelector({
    visible,
    accounts,
    selectedId,
    onClose,
    onSelect,
}: AccountSelectorProps) {
    const { theme } = useTheme();

    const initialScrollIndex = React.useMemo(() => {
        if (!selectedId) return undefined;
        const index = accounts.findIndex(a => a.id === selectedId);
        return index !== -1 ? index : undefined;
    }, [accounts, selectedId]);

    const getAccountColor = (type: string) => {
        const key = journalPresenter.getAccountColorKey(type);
        return (theme as any)[key] || theme.primary;
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <AppText variant="heading">Select Account</AppText>
                        <TouchableOpacity onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
                            <AppText variant="body" color="secondary">✕</AppText>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={accounts}
                        keyExtractor={(item) => item.id}
                        initialScrollIndex={initialScrollIndex}
                        getItemLayout={(_, index) => ({
                            length: 70, // Rough height of ListRow + margin
                            offset: 70 * index,
                            index,
                        })}
                        renderItem={({ item }) => {
                            const isSelected = item.id === selectedId;
                            const accountColor = getAccountColor(item.accountType);

                            return (
                                <ListRow
                                    title={item.name}
                                    subtitle={`${item.accountType} • ${item.currencyCode}`}
                                    onPress={() => onSelect(item.id)}
                                    style={[styles.accountRow, {
                                        backgroundColor: theme.surface,
                                        borderColor: isSelected ? accountColor : theme.border,
                                        borderWidth: isSelected ? 2 : 1,
                                    }]}
                                    padding="md"
                                />
                            );
                        }}
                        contentContainerStyle={styles.accountsListContent}
                        style={styles.accountsList}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: Shape.radius.r2,
        borderTopRightRadius: Shape.radius.r2,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    accountRow: {
        borderWidth: 1,
        borderRadius: Shape.radius.r3,
        marginBottom: Spacing.sm,
    },
    accountsList: {
        flex: 1,
    },
    accountsListContent: {
        padding: Spacing.md,
    },
});
