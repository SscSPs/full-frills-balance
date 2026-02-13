import { AppIcon, AppText } from '@/src/components/core';
import { Opacity, Shape, Size, Spacing, withOpacity } from '@/src/constants';
import Account from '@/src/data/models/Account';
import { useTheme } from '@/src/hooks/use-theme';
import { journalPresenter } from '@/src/utils/journalPresenter';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

export interface AccountTileProps {
    account: Account;
    isSelected: boolean;
    onSelect: (id: string) => void;
    tintColor?: string;
    style?: StyleProp<ViewStyle>;
}

export const AccountTile = ({
    account,
    isSelected,
    onSelect,
    tintColor,
    style,
}: AccountTileProps) => {
    const { theme } = useTheme();
    const colorKey = journalPresenter.getAccountColorKey(account.accountType);
    const accountColor = tintColor || (theme as any)[colorKey] || theme.primary;

    return (
        <TouchableOpacity
            testID={`account-option-${account.name.replace(/\s+/g, '-')}`}
            style={[
                styles.accountCard,
                { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                isSelected && {
                    backgroundColor: withOpacity(accountColor, Opacity.soft),
                    borderColor: accountColor
                },
                style
            ]}
            onPress={() => onSelect(isSelected ? '' : account.id)}
        >
            <View style={[styles.accountIndicator, { backgroundColor: accountColor, opacity: isSelected ? 1 : Opacity.soft }]} />
            <AppText
                variant="body"
                weight={isSelected ? "semibold" : "regular"}
                style={{ color: theme.text, flex: 1 }}
            >
                {account.name}
            </AppText>
            {isSelected && (
                <AppIcon name="checkCircle" size={18} color={accountColor} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    accountCard: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Shape.radius.sm,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        minWidth: Size.cardMinWidth,
    },
    accountIndicator: {
        width: 4,
        height: 16,
        borderRadius: Shape.radius.full,
    },
});
