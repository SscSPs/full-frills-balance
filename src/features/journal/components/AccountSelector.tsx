import { AppText, ListRow } from '@/src/components/core';
import { Shape, Spacing } from '@/src/constants';
import Account from '@/src/data/models/Account';
import { useTheme } from '@/src/hooks/use-theme';
import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccountSelectorProps {
    visible: boolean;
    accounts: Account[];
    onClose: () => void;
    onSelect: (accountId: string) => void;
}

export function AccountSelector({
    visible,
    accounts,
    onClose,
    onSelect,
}: AccountSelectorProps) {
    const { theme } = useTheme();

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
                        renderItem={({ item }) => (
                            <ListRow
                                title={item.name}
                                subtitle={`${item.accountType} • ${item.currencyCode}`}
                                onPress={() => onSelect(item.id)}
                                style={[styles.accountRow, {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                }]}
                                padding="md"
                            />
                        )}
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
