import { AppButton, AppText } from '@/src/components/core';
import { AppIcon, IconName } from '@/src/components/core/AppIcon';
import { Opacity, Shape, Size, Spacing, withOpacity } from '@/src/constants';
import { useTheme } from '@/src/hooks/use-theme';
import React from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface IconPickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (iconName: IconName) => void;
    selectedIcon?: IconName;
}

const AVAILABLE_ICONS: IconName[] = [
    'wallet', 'bank', 'safe', 'creditCard', 'trendingUp', 'briefcase',
    'coffee', 'shoppingCart', 'bus', 'film', 'shoppingBag', 'tag',
    'home', 'receipt', 'document', 'folderOpen', 'calendar', 'refresh'
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
    visible,
    onClose,
    onSelect,
    selectedIcon
}) => {
    const { theme } = useTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={[styles.overlay, { backgroundColor: theme.overlay }]}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <AppText variant="title" style={styles.title}>Select Icon</AppText>

                    <FlatList
                        data={AVAILABLE_ICONS}
                        numColumns={4}
                        keyExtractor={(item) => item}
                        contentContainerStyle={styles.list}
                        renderItem={({ item }) => {
                            const isSelected = selectedIcon === item;
                            return (
                                <TouchableOpacity
                                    style={[
                                        styles.iconItem,
                                        {
                                            backgroundColor: isSelected ? withOpacity(theme.primary, Opacity.soft) : theme.surface,
                                            borderColor: isSelected ? theme.primary : theme.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        onSelect(item);
                                        onClose();
                                    }}
                                >
                                    <AppIcon
                                        name={item}
                                        size={Size.md}
                                        color={isSelected ? theme.primary : theme.textSecondary}
                                    />
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <AppButton
                        variant="outline"
                        onPress={onClose}
                        style={styles.closeButton}
                    >
                        Cancel
                    </AppButton>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        borderRadius: Shape.radius.r4,
        padding: Spacing.lg,
        maxHeight: '70%',
    },
    title: {
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    list: {
        gap: Spacing.md,
        paddingBottom: Spacing.md,
    },
    iconItem: {
        flex: 1,
        aspectRatio: 1,
        margin: Spacing.xs,
        borderRadius: Shape.radius.r3,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        marginTop: Spacing.md,
    },
});
