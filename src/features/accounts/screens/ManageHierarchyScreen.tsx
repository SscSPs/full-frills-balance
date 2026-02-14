import { AppButton, AppIcon, AppText } from '@/src/components/core';
import { Screen } from '@/src/components/layout';
import { Size, Spacing } from '@/src/constants';
import { AccountType } from '@/src/data/models/Account';
import { useAccountActions, useAccountBalances, useAccounts } from '@/src/features/accounts/hooks/useAccounts';
import { useTheme } from '@/src/hooks/use-theme';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function ManageHierarchyScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { accounts } = useAccounts();
    const { balancesByAccountId } = useAccountBalances(accounts);
    const { updateAccount } = useAccountActions();

    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [expandedAccountIds, setExpandedAccountIds] = useState<Set<string>>(new Set());

    const toggleExpand = useCallback((accountId: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedAccountIds(prev => {
            const next = new Set(prev);
            if (next.has(accountId)) next.delete(accountId);
            else next.add(accountId);
            return next;
        });
    }, []);

    const accountsByParent = useMemo(() => {
        const groups = new Map<string | null, any[]>();
        accounts.forEach(a => {
            const parentId = a.parentAccountId || null;
            if (!groups.has(parentId)) groups.set(parentId, []);
            groups.get(parentId)!.push(a);
        });
        return groups;
    }, [accounts]);

    const handleAssignParent = async (accountId: string, parentId: string | null) => {
        console.log(`[ManageHierarchy] handleAssignParent - account: ${accountId}, parent: ${parentId}`);
        const account = accounts.find(a => a.id === accountId);
        if (!account) return;
        try {
            await updateAccount(account, { parentAccountId: parentId });
        } catch (error) {
            console.error(`[ManageHierarchy] updateAccount failed:`, error);
        }
        setSelectedAccountId(null);
    };

    const handleAddChild = async (parentId: string, childId: string) => {
        console.log(`[ManageHierarchy] handleAddChild - parent: ${parentId}, child: ${childId}`);
        const childAccount = accounts.find(a => a.id === childId);
        if (!childAccount) return;
        try {
            await updateAccount(childAccount, { parentAccountId: parentId });
        } catch (error) {
            console.error(`[ManageHierarchy] handleAddChild failed:`, error);
        }
        setSelectedAccountId(null);
    };

    const renderAccountItem = (account: any, level = 0, isLast = false, parentPaths: boolean[] = []) => {
        const balance = balancesByAccountId.get(account.id);
        const children = accountsByParent.get(account.id) || [];
        const hasChildren = children.length > 0;
        const isExpanded = expandedAccountIds.has(account.id);
        const canBeParent = (balance?.transactionCount || 0) === 0;
        const isSelected = selectedAccountId === account.id;

        return (
            <View key={account.id}>
                <View style={[styles.accountRowContainer, isSelected && { backgroundColor: theme.surfaceSecondary }]}>
                    {/* Visual Spacing and Connectors */}
                    <View style={[styles.connectorsContainer, { width: level === 0 ? 8 : (level * 32) }]}>
                        {level > 0 && parentPaths.map((hasNeighbor, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.connectorColumn,
                                    { borderLeftColor: hasNeighbor ? theme.divider : 'transparent' }
                                ]}
                            />
                        ))}
                        {level > 0 && (
                            <View style={styles.leafConnectorPlaceholder}>
                                <View style={[styles.connectorLineVertical, { backgroundColor: theme.divider, height: isLast ? '50%' : '100%' }]} />
                                <View style={[styles.connectorLineHorizontal, { backgroundColor: theme.divider }]} />
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.accountRowContent}
                        onPress={() => hasChildren && toggleExpand(account.id)}
                        disabled={!hasChildren}
                    >
                        <View style={styles.iconWrapper}>
                            <AppIcon
                                name={(account.icon || 'wallet') as any}
                                size={Size.iconSm}
                                color={!hasChildren && !account.parentAccountId ? theme.textTertiary : theme.textSecondary}
                            />
                        </View>
                        <View style={styles.accountText}>
                            <AppText
                                variant="body"
                                weight={hasChildren ? "bold" : "regular"}
                                color={!hasChildren && !account.parentAccountId ? "secondary" : "primary"}
                            >
                                {account.name}
                            </AppText>
                        </View>

                        <View style={styles.rowActions}>
                            {!canBeParent && (
                                <View style={styles.statusBadge}>
                                    <AppText variant="caption" color="warning" style={{ fontSize: 10 }}>DATA</AppText>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.actionIconButton, { backgroundColor: theme.primary + '10' }]}
                                onPress={() => setSelectedAccountId(account.id)}
                            >
                                <AppIcon name="reorder" size={Size.iconXs} color={theme.primary} />
                                <AppText variant="caption" color="primary" weight="bold">MOVE</AppText>
                            </TouchableOpacity>

                            {account.parentAccountId && (
                                <TouchableOpacity
                                    style={[styles.actionIconButton, { backgroundColor: theme.error + '10' }]}
                                    onPress={() => handleAssignParent(account.id, null)}
                                >
                                    <AppIcon name="close" size={Size.iconXs} color={theme.error} />
                                    <AppText variant="caption" color="error" weight="bold">TOP</AppText>
                                </TouchableOpacity>
                            )}

                            {canBeParent && (
                                <TouchableOpacity
                                    style={[styles.actionIconButton, { backgroundColor: theme.success + '10' }]}
                                    onPress={() => setSelectedAccountId(account.id)}
                                >
                                    <AppIcon name="add" size={Size.iconXs} color={theme.success} />
                                    <AppText variant="caption" color="success" weight="bold">ADD</AppText>
                                </TouchableOpacity>
                            )}

                            {hasChildren && (
                                <TouchableOpacity
                                    onPress={() => toggleExpand(account.id)}
                                    style={styles.expandButton}
                                >
                                    <AppIcon
                                        name={isExpanded ? "chevronDown" : "chevronRight"}
                                        size={Size.iconXs}
                                        color={theme.textTertiary}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {
                    isExpanded && hasChildren && (
                        <View>
                            {children.map((child, index) =>
                                renderAccountItem(
                                    child,
                                    level + 1,
                                    index === children.length - 1,
                                    [...parentPaths, !isLast]
                                )
                            )}
                        </View>
                    )
                }
            </View >
        );
    };

    const rootAccounts = useMemo(() => accounts.filter(a => !a.parentAccountId), [accounts]);

    const visibleRootAccountsByCategory = useMemo(() => {
        const groups: Record<string, any[]> = {
            [AccountType.ASSET]: [],
            [AccountType.LIABILITY]: [],
            [AccountType.EQUITY]: [],
            [AccountType.INCOME]: [],
            [AccountType.EXPENSE]: [],
        };
        rootAccounts.forEach(acc => {
            const children = accountsByParent.get(acc.id) || [];
            const balance = balancesByAccountId.get(acc.id);
            const hasTransactions = (balance?.transactionCount || 0) > 0;

            // Filter: Only show if it has children OR it doesn't have transactions (blank parent)
            if (children.length > 0 || !hasTransactions) {
                if (groups[acc.accountType]) {
                    groups[acc.accountType].push(acc);
                }
            }
        });
        return groups;
    }, [rootAccounts, accountsByParent, balancesByAccountId]);

    return (
        <Screen title="Manage Hierarchy">
            <View style={styles.header}>
                <AppText variant="body" color="secondary">
                    Select an account to move it, or create a new parent organizational account.
                </AppText>
                <AppButton
                    onPress={() => router.push('/account-creation')}
                    variant="secondary"
                    style={styles.newButton}
                >
                    New Parent Account
                </AppButton>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {Object.entries(visibleRootAccountsByCategory).map(([category, catAccounts]) => (
                    catAccounts.length > 0 && (
                        <View key={category} style={styles.categorySection}>
                            <View style={[styles.categoryHeader, { backgroundColor: theme.surfaceSecondary }]}>
                                <AppText variant="caption" weight="bold" color="secondary" style={styles.categoryTitle}>
                                    {category}
                                </AppText>
                            </View>
                            {catAccounts.map((account, index) =>
                                renderAccountItem(account, 0, index === catAccounts.length - 1, [])
                            )}
                        </View>
                    )
                ))}
            </ScrollView>

            <Modal
                visible={!!selectedAccountId}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedAccountId(null)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setSelectedAccountId(null)}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <AppText variant="subheading" weight="bold">Hierarchy Builder</AppText>
                            <AppText variant="caption" color="secondary">
                                Configure structure for "{accounts.find(a => a.id === selectedAccountId)?.name}"
                            </AppText>
                        </View>

                        <ScrollView style={styles.modalScroll}>

                            {/* Option 2: Add Child (if account has no transactions) */}
                            {(balancesByAccountId.get(selectedAccountId || '')?.transactionCount || 0) === 0 && (
                                <View style={styles.destinationSection}>
                                    <AppText variant="caption" weight="bold" style={styles.sectionLabel}>ADD AVAILABLE ACCOUNTS AS CHILDREN:</AppText>
                                    {accounts
                                        .filter(a => {
                                            const isOwnParent = a.id === selectedAccountId;
                                            const isRoot = !a.parentAccountId;
                                            const sameType = a.accountType === accounts.find(s => s.id === selectedAccountId)?.accountType;
                                            return isRoot && !isOwnParent && sameType;
                                        })
                                        .map(potentialChild => (
                                            <TouchableOpacity
                                                key={potentialChild.id}
                                                style={[styles.destinationItem, { borderBottomColor: theme.divider }]}
                                                onPress={() => selectedAccountId && handleAddChild(selectedAccountId, potentialChild.id)}
                                            >
                                                <AppIcon name={(potentialChild.icon || 'wallet') as any} size={Size.iconSm} color={theme.textSecondary} />
                                                <View style={{ flex: 1 }}>
                                                    <AppText variant="body">{potentialChild.name}</AppText>
                                                    {(balancesByAccountId.get(potentialChild.id)?.transactionCount || 0) > 0 && (
                                                        <AppText variant="caption" color="secondary">Has Transactions</AppText>
                                                    )}
                                                </View>
                                                <AppIcon name="add" size={Size.iconXs} color={theme.success} />
                                            </TouchableOpacity>
                                        ))
                                    }
                                </View>
                            )}

                            {/* Option 3: Move under another parent */}
                            <View style={styles.destinationSection}>
                                <AppText variant="caption" weight="bold" style={styles.sectionLabel}>MOVE UNDER ANOTHER PARENT:</AppText>
                                {accounts
                                    .filter(a => {
                                        const balance = balancesByAccountId.get(a.id);
                                        const isSameAccount = a.id === selectedAccountId;
                                        const canTakeChild = (balance?.transactionCount || 0) === 0;
                                        const sameType = a.accountType === accounts.find(s => s.id === selectedAccountId)?.accountType;
                                        return !isSameAccount && canTakeChild && sameType;
                                    })
                                    .map(parent => (
                                        <TouchableOpacity
                                            key={parent.id}
                                            style={[styles.destinationItem, { borderBottomColor: theme.divider }]}
                                            onPress={() => selectedAccountId && handleAssignParent(selectedAccountId, parent.id)}
                                        >
                                            <AppIcon name={(parent.icon || 'wallet') as any} size={Size.iconSm} color={theme.textSecondary} />
                                            <AppText variant="body" style={{ flex: 1 }}>{parent.name}</AppText>
                                            {accounts.find(a => a.id === selectedAccountId)?.parentAccountId === parent.id && (
                                                <AppIcon name="check" size={Size.iconSm} color={theme.success} />
                                            )}
                                        </TouchableOpacity>
                                    ))
                                }
                            </View>
                        </ScrollView>

                        <AppButton
                            onPress={() => setSelectedAccountId(null)}
                            variant="ghost"
                            style={styles.cancelButton}
                        >
                            Cancel
                        </AppButton>
                    </View>
                </Pressable>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    newButton: {
        alignSelf: 'flex-start',
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: 40,
    },
    accountRowContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    connectorsContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    connectorColumn: {
        width: 32,
        height: '100%',
        borderLeftWidth: 1,
        marginLeft: 15, // Center line in 32px column
    },
    leafConnectorPlaceholder: {
        width: 32,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectorLineVertical: {
        position: 'absolute',
        left: 15,
        top: 0,
        width: 1,
    },
    connectorLineHorizontal: {
        position: 'absolute',
        left: 15,
        top: '50%',
        width: 12,
        height: 1,
    },
    accountRowContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingRight: Spacing.md,
        gap: Spacing.sm,
    },
    iconWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 32,
    },
    expandIcon: {
        width: 12,
    },
    accountText: {
        flex: 1,
    },
    rowActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: 'rgba(255, 171, 0, 0.1)',
        borderRadius: 4,
    },
    actionIconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    expandButton: {
        padding: 4,
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        marginBottom: Spacing.lg,
    },
    modalScroll: {
        marginBottom: Spacing.md,
    },
    categorySection: {
        marginBottom: Spacing.md,
    },
    categoryHeader: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        marginBottom: Spacing.xs,
        borderRadius: 4,
    },
    categoryTitle: {
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    destinationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.md,
    },
    destinationSection: {
        marginTop: Spacing.lg,
    },
    sectionLabel: {
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    cancelButton: {
        marginTop: Spacing.sm,
    }
});
