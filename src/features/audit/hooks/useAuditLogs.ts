import { auditService } from '@/src/services/audit-service';
import { AuditLogEntry } from '@/src/features/audit/components/AuditLogItem';
import { logger } from '@/src/utils/logger';
import { useCallback, useEffect, useState } from 'react';

export function useAuditLogs(params: { entityType?: string; entityId?: string }) {
    const { entityType, entityId } = params;
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isFiltered = !!(entityType && entityId);

    const loadLogs = useCallback(async () => {
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
            logger.error('Failed to load audit logs:', error);
        } finally {
            setIsLoading(false);
        }
    }, [entityType, entityId, isFiltered]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    return { logs, isLoading, reload: loadLogs };
}
