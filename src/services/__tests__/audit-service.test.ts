import { AuditAction } from '@/src/data/models/AuditLog';
import { auditRepository } from '@/src/data/repositories/AuditRepository';
import { auditService } from '@/src/services/audit-service';

// Mock dependencies
jest.mock('@/src/data/repositories/AuditRepository');
jest.mock('@/src/data/database/Database', () => ({
    database: {
        write: jest.fn((callback) => callback()),
        batch: jest.fn()
    }
}));


describe('AuditService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('log', () => {
        it('should delegate logging to repository', async () => {
            const entry = {
                entityType: 'account' as const,
                entityId: 'acc1',
                action: AuditAction.UPDATE,
                changes: { name: 'New Name' }
            };

            await auditService.log(entry);

            expect(auditRepository.log).toHaveBeenCalledWith(entry);
        });
    });

    describe('getAuditTrail', () => {
        it('should fetch by entity from repository', async () => {
            const mockLogs = [{ id: 'log1' }];
            (auditRepository.findByEntity as jest.Mock).mockResolvedValue(mockLogs);

            const result = await auditService.getAuditTrail('account', 'acc1');

            expect(auditRepository.findByEntity).toHaveBeenCalledWith('account', 'acc1');
            expect(result).toBe(mockLogs);
        });
    });

    describe('getRecentLogs', () => {
        it('should fetch recent logs from repository', async () => {
            const mockLogs = [{ id: 'log1' }, { id: 'log2' }];
            (auditRepository.fetchRecent as jest.Mock).mockResolvedValue(mockLogs);

            const result = await auditService.getRecentLogs(50);

            expect(auditRepository.fetchRecent).toHaveBeenCalledWith(50);
            expect(result).toBe(mockLogs);
        });

        it('should use default limit if not provided', async () => {
            await auditService.getRecentLogs();
            expect(auditRepository.fetchRecent).toHaveBeenCalledWith(100);
        });
    });

    describe('cleanupLegacyEntityTypes', () => {
        it('should return 0 if no uppercase logs exist', async () => {
            (auditRepository.findAll as jest.Mock).mockResolvedValue([
                { entityType: 'account' },
                { entityType: 'journal' }
            ]);

            const result = await auditService.cleanupLegacyEntityTypes();

            expect(result).toBe(0);
        });

        it('should update uppercase logs to lowercase', async () => {
            const mockPrepareUpdate = jest.fn((callback) => {
                const record = {
                    entityType: '',
                    // Mock properties to satisfy WatermelonDB batching/status checks
                    _status: 'updated',
                    _isEditing: false,
                    __initialized: true
                };
                callback(record);
                return record;
            });

            const uppercaseLogs = [
                {
                    entityType: 'ACCOUNT',
                    prepareUpdate: mockPrepareUpdate,
                    _status: 'synced',
                    _isEditing: false,
                    __initialized: true
                },
                {
                    entityType: 'Journal',
                    prepareUpdate: mockPrepareUpdate,
                    _status: 'synced',
                    _isEditing: false,
                    __initialized: true
                }
            ];

            (auditRepository.findAll as jest.Mock).mockResolvedValue([
                ...uppercaseLogs,
                { entityType: 'transaction' }
            ]);

            const result = await auditService.cleanupLegacyEntityTypes();

            expect(result).toBe(2);
            expect(mockPrepareUpdate).toHaveBeenCalledTimes(2);
        });
    });
});
