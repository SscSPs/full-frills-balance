import { Model } from '@nozbe/watermelondb'
import { date, field } from '@nozbe/watermelondb/decorators'

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export default class AuditLog extends Model {
    static table = 'audit_logs'

    @field('entity_type') entityType!: string // 'journal', 'transaction', 'account'
    @field('entity_id') entityId!: string
    @field('action') action!: AuditAction
    @field('changes') changes!: string // JSON string of before/after state
    @field('timestamp') timestamp!: number

    @date('created_at') createdAt!: Date

    // Helper to parse changes JSON
    get parsedChanges(): any {
        try {
            return JSON.parse(this.changes)
        } catch {
            return null
        }
    }
}
