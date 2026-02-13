import { AppButton, AppCard, AppText } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { AppConfig, Shape, Size, Spacing, Typography } from '@/src/constants';
import { useImportPlugins } from '@/src/features/settings/hooks/useImportPlugins';
import { useImport } from '@/src/hooks/use-import';
import { useTheme } from '@/src/hooks/use-theme';
import type { ImportPlugin } from '@/src/services/import/types';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

interface ImportPluginCardProps {
    plugin: ImportPlugin;
    index: number;
    isImporting: boolean;
    onSelect: (id: string) => void;
}

const ImportPluginCard = ({ plugin, index, isImporting, onSelect }: ImportPluginCardProps) => {
    const { theme } = useTheme();
    const handleSelect = useCallback(() => {
        onSelect(plugin.id);
    }, [onSelect, plugin.id]);

    return (
        <AppCard key={plugin.id} elevation="sm" padding="md" style={styles.card}>
            <View style={styles.headerRow}>
                <View style={[styles.iconPlaceholder, { backgroundColor: theme.surfaceSecondary }]}>
                    <AppText variant="heading" style={{ fontSize: Typography.sizes.xxl }}>{plugin.icon}</AppText>
                </View>
                <View style={styles.textCol}>
                    <AppText variant="subheading">{plugin.name}</AppText>
                    <AppText variant="caption" color="secondary" style={styles.desc}>
                        {plugin.description}
                    </AppText>
                </View>
            </View>
            <AppButton
                variant={index === 0 ? 'primary' : 'outline'}
                onPress={handleSelect}
                loading={isImporting}
                style={styles.button}
            >
                {AppConfig.strings.settings.selectFile(plugin.name.split(' ')[0])}
            </AppButton>
        </AppCard>
    );
};

export default function ImportSelectionScreen() {
    const { handleImport, isImporting } = useImport();
    const plugins = useImportPlugins();
    const handleSelect = useCallback((id: string) => {
        handleImport(id);
    }, [handleImport]);

    return (
        <Screen
            title={AppConfig.strings.settings.importTitle}
            showBack={true}
            scrollable
            withPadding
        >
            <View style={styles.container}>
                <AppText variant="body" style={styles.intro}>
                    {AppConfig.strings.settings.importIntro}
                </AppText>

                {plugins.map((plugin, index) => (
                    <ImportPluginCard
                        key={plugin.id}
                        plugin={plugin}
                        index={index}
                        onSelect={handleSelect}
                        isImporting={isImporting}
                    />
                ))}

                <View style={styles.note}>
                    <AppText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                        {AppConfig.strings.settings.importNote}
                    </AppText>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.md,
        gap: Spacing.md,
    },
    intro: {
        marginBottom: Spacing.sm,
    },
    card: {
        marginBottom: Spacing.sm,
    },
    headerRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    iconPlaceholder: {
        width: Size.xxl,
        height: Size.xxl,
        borderRadius: Shape.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    textCol: {
        flex: 1,
    },
    desc: {
        marginTop: Spacing.xs,
        lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
    },
    button: {
        width: '100%',
    },
    note: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
    }
});
