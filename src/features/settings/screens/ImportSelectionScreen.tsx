
import { AppButton, AppCard, AppText } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Spacing } from '@/src/constants';
import { useImport } from '@/src/hooks/use-import';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function ImportSelectionScreen() {
    const { handleImport, isImporting } = useImport();

    const onImportNative = () => handleImport('native');
    const onImportIvy = () => handleImport('ivy');

    return (
        <Screen
            title="Import Data"
            showBack={true}
            scrollable
            withPadding
        >
            <View style={styles.container}>
                <AppText variant="body" style={styles.intro}>
                    Choose the format of your backup file to restore your data.
                </AppText>

                <AppCard elevation="sm" padding="md" style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconPlaceholder}>
                            <AppText variant="heading" style={{ fontSize: 24 }}>⚡️</AppText>
                        </View>
                        <View style={styles.textCol}>
                            <AppText variant="subheading">Full Frills Backup</AppText>
                            <AppText variant="caption" color="secondary" style={styles.desc}>
                                Restore from a JSON backup file created by this app.
                            </AppText>
                        </View>
                    </View>
                    <AppButton
                        variant="primary"
                        onPress={onImportNative}
                        loading={isImporting}
                        style={styles.button}
                    >
                        Select Backup File
                    </AppButton>
                </AppCard>

                <AppCard elevation="sm" padding="md" style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.iconPlaceholder}>
                            <AppText variant="heading" style={{ fontSize: 24 }}>🌱</AppText>
                        </View>
                        <View style={styles.textCol}>
                            <AppText variant="subheading">Ivy Wallet Backup</AppText>
                            <AppText variant="caption" color="secondary" style={styles.desc}>
                                Migrate data from an Ivy Wallet export (JSON/CSV).
                            </AppText>
                        </View>
                    </View>
                    <AppButton
                        variant="outline"
                        onPress={onImportIvy}
                        loading={isImporting}
                        style={styles.button}
                    >
                        Select Ivy Wallet File
                    </AppButton>
                </AppCard>

                <View style={styles.note}>
                    <AppText variant="caption" color="secondary" style={{ textAlign: 'center' }}>
                        Note: Importing will replace all existing data on this device.
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
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    textCol: {
        flex: 1,
    },
    desc: {
        marginTop: Spacing.xs,
        lineHeight: 20,
    },
    button: {
        width: '100%',
    },
    note: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.xl,
    }
});
