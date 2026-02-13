import { AuditEntityType } from '@/src/data/models/AuditLog';
import { useAuditAccounts } from '@/src/features/audit/hooks/useAuditData';
import { useAuditLogs } from '@/src/features/audit/hooks/useAuditLogs';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

export interface AuditLogViewModel {
    logs: ReturnType<typeof useAuditLogs>['logs'];
    accountMap: ReturnType<typeof useAuditAccounts>['accountMap'];
    isLoading: boolean;
    isFiltered: boolean;
    expandedIds: Set<string>;
    onToggleExpanded: (id: string) => void;
}

export function useAuditLogViewModel() {
    const { entityType, entityId } = useLocalSearchParams<{ entityType?: AuditEntityType; entityId?: string }>();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    const { accountMap, isLoading: accountsLoading } = useAuditAccounts();
    const { logs, isLoading } = useAuditLogs({ entityType, entityId });

    const isFiltered = !!entityId;

    const onToggleExpanded = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    return {
        logs,
        accountMap,
        isLoading: isLoading || accountsLoading,
        isFiltered,
        expandedIds,
        onToggleExpanded,
    };
}
