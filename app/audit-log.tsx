import { AppCard, AppText } from '@/components/core';
import { Spacing } from '@/constants';
import { useTheme } from '@/hooks/use-theme';
import { AuditAction } from '@/src/data/models/AuditLog';
import { auditService } from '@/src/services/audit-service';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AuditLogEntry {
    id: string;
    entityType: string;
    entityId: string;
    action: AuditAction;
    changes: string;
    timestamp: number;
}

interface ParsedChanges {
    before?: Record<string, any>;
    after?: Record<string, any>;
    [key: string]: any;
}

export default function AuditLogScreen() {
    const { theme } = useTheme();
    const { entityType, entityId } = useLocalSearchParams<{ entityType?: string; entityId?: string }>();

    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const isFiltered = !!(entityType && entityId);

    useEffect(() => {
        loadLogs();
    }, [entityType, entityId]);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            let fetchedLogs;
            if (isFiltered) {
                fetchedLogs = await auditService.getAuditTrail(entityType!, entityId!);
            } else {
                fetchedLogs = await auditService.getRecentLogs(200);
            }
            setLogs(fetchedLogs.map(log => ({
                id: log.id,
                entityType: log.entityType,
                entityId: log.entityId,
                action: log.action,
                changes: log.changes,
                timestamp: log.timestamp,
            })));
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const getActionColor = (action: AuditAction): string => {
        switch (action) {
            case AuditAction.CREATE:
                return theme.income;
            case AuditAction.UPDATE:
                return theme.transfer;
            case AuditAction.DELETE:
                return theme.expense;
            default:
                return theme.text;
        }
    };

    const getActionIcon = (action: AuditAction): keyof typeof Ionicons.glyphMap => {
        switch (action) {
            case AuditAction.CREATE:
                return 'add-circle-outline';
            case AuditAction.UPDATE:
                return 'pencil-outline';
            case AuditAction.DELETE:
                return 'trash-outline';
            default:
                return 'ellipse-outline';
        }
    };

    const formatTimestamp = (timestamp: number): string => {
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    const parseChanges = (changes: string): ParsedChanges | null => {
        try {
            return JSON.parse(changes);
        } catch {
            return null;
        }
    };

    const renderChangeValue = (value: any): string => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        return String(value);
    };

    const renderChanges = (changes: ParsedChanges) => {
        if (changes.before && changes.after) {
            // Before/After comparison
            return (
                <View style={styles.changesContainer}>
                    <AppText variant="caption" color="secondary" weight="semibold">Before:</AppText>
                    {Object.entries(changes.before).map(([key, value]) => (
                        <AppText key={`before-${key}`} variant="caption" color="error">
                            {key}: {renderChangeValue(value)}
                        </AppText>
                    ))}
                    <AppText variant="caption" color="secondary" weight="semibold" style={{ marginTop: Spacing.xs }}>After:</AppText>
                    {Object.entries(changes.after).map(([key, value]) => (
                        <AppText key={`after-${key}`} variant="caption" color="income">
                            {key}: {renderChangeValue(value)}
                        </AppText>
                    ))}
                </View>
            );
        }

        // Simple key-value changes
        return (
            <View style={styles.changesContainer}>
                {Object.entries(changes).map(([key, value]) => (
                    <AppText key={key} variant="caption" color="secondary">
                        {key}: {renderChangeValue(value)}
                    </AppText>
                ))}
            </View>
        );
    };

    const renderItem = ({ item }: { item: AuditLogEntry }) => {
        const isExpanded = expandedIds.has(item.id);
        const parsedChanges = parseChanges(item.changes);
        const actionColor = getActionColor(item.action);

        return (
            <AppCard style={styles.card} padding="md" elevation="sm">
                <TouchableOpacity onPress={() => toggleExpanded(item.id)}>
                    <View style={styles.row}>
                        <View style={[styles.iconContainer, { backgroundColor: actionColor + '20' }]}>
                            <Ionicons name={getActionIcon(item.action)} size={20} color={actionColor} />
                        </View>
                        <View style={styles.content}>
                            <View style={styles.headerRow}>
                                <AppText variant="body" weight="semibold">
                                    {item.entityType.charAt(0).toUpperCase() + item.entityType.slice(1)}
                                </AppText>
                                <AppText variant="caption" style={{ color: actionColor }}>
                                    {item.action}
                                </AppText>
                            </View>
                            <AppText variant="caption" color="secondary">
                                {formatTimestamp(item.timestamp)}
                            </AppText>
                            <AppText variant="caption" color="secondary" numberOfLines={1}>
                                ID: {item.entityId.substring(0, 12)}...
                            </AppText>
                        </View>
                        <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.textSecondary}
                        />
                    </View>
                    {isExpanded && parsedChanges && renderChanges(parsedChanges)}
                </TouchableOpacity>
            </AppCard>
        );
    };

    return (
        <>
            <Stack.Screen options={{
                title: isFiltered ? 'Edit History' : 'Audit Log',
                headerStyle: { backgroundColor: theme.background },
                headerTintColor: theme.text,
            }} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : logs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={64} color={theme.textSecondary} />
                        <AppText variant="body" color="secondary" style={styles.emptyText}>
                            No audit logs found
                        </AppText>
                    </View>
                ) : (
                    <FlatList
                        data={logs}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
    },
    emptyText: {
        marginTop: Spacing.sm,
    },
    list: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        marginBottom: Spacing.sm,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        gap: Spacing.xs / 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    changesContainer: {
        marginTop: Spacing.md,
        padding: Spacing.sm,
        borderRadius: 8,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
    },
});
