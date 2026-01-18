import { AppText } from '@/components/core';
import { Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccountSelectorProps {
    visible: boolean;
    accounts: any[]; // Replace with proper Account type when available
    themeMode: ThemeMode;
    onClose: () => void;
    onSelect: (accountId: string) => void;
}

export function AccountSelector({
    visible,
    accounts,
    themeMode,
    onClose,
    onSelect,
}: AccountSelectorProps) {
    const theme = useThemeColors(themeMode);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <AppText variant="heading" themeMode={themeMode}>Select Account</AppText>
                        <TouchableOpacity onPress={onClose}>
                            <AppText variant="body" color="secondary" themeMode={themeMode}>✕</AppText>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={accounts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[styles.accountItem, {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border
                                }]}
                                onPress={() => onSelect(item.id)}
                            >
                                <View>
                                    <AppText variant="body" themeMode={themeMode}>{item.name}</AppText>
                                    <AppText variant="caption" color="secondary" themeMode={themeMode}>
                                        {item.accountType} • {item.currencyCode}
                                    </AppText>
                                </View>
                            </TouchableOpacity>
                        )}
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: Shape.radius.r1,
        borderTopRightRadius: Shape.radius.r1,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
    },
    accountItem: {
        padding: Spacing.md,
        borderWidth: 1,
        borderRadius: Shape.radius.r3,
        marginBottom: Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    accountsList: {
        flex: 1,
        padding: Spacing.md,
    },
});
