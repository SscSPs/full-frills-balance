import AuditLog from '@/src/data/models/AuditLog'
import { AuditEntry, auditRepository } from '@/src/data/repositories/AuditRepository'

/**
 * Audit Service
 * 
 * Thin wrapper around AuditRepository for logging and retrieving audit entries.
 */
export class AuditService {
    /**
     * Log an audit entry
     */
    async log(entry: AuditEntry): Promise<void> {
        return auditRepository.log(entry)
    }

    /**
     * Get audit trail for a specific entity
     */
    async getAuditTrail(
        entityType: string,
        entityId: string
    ): Promise<AuditLog[]> {
        return auditRepository.findByEntity(entityType, entityId)
    }

    /**
     * Get recent audit logs (for audit viewer)
     */
    async getRecentLogs(limit: number = 100): Promise<AuditLog[]> {
        return auditRepository.fetchRecent(limit)
    }

    /**
     * Observe audit trail for a specific entity
     */
    observeAuditTrail(entityType: string, entityId: string) {
        return auditRepository.observeByEntity(entityType, entityId)
    }

    /**
     * Observe recent audit logs
     */
    observeRecentLogs(limit: number = 100) {
        return auditRepository.observeRecent(limit)
    }
}

// Export singleton instance
export const auditService = new AuditService()
