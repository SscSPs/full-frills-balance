import { Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchFieldProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    themeMode: ThemeMode;
}

/**
 * SearchField - Ivy Wallet inspired search input
 */
export const SearchField = ({ value, onChangeText, placeholder = "Search transactions...", themeMode }: SearchFieldProps) => {
    const theme = useThemeColors(themeMode);

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.icon} />
            <TextInput
                style={[styles.input, { color: theme.text }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.primary}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: Shape.radius.lg,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
    },
    icon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    clearButton: {
        padding: Spacing.xs,
    },
});
