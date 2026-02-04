import { TransactionType } from '@/src/data/models/Transaction';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { JournalService } from '@/src/features/journal/services/JournalService';
import { accountingService } from '@/src/utils/accountingService';
import { logger } from '@/src/utils/logger';

// Mock dependencies
jest.mock('@/src/data/repositories/AccountRepository');
jest.mock('@/src/data/repositories/JournalRepository');
jest.mock('@/src/data/repositories/TransactionRepository');
jest.mock('@/src/data/repositories/CurrencyRepository');
jest.mock('@/src/services/audit-service');
jest.mock('@/src/services/RebuildQueueService');
jest.mock('@/src/utils/accountingService');
jest.mock('@/src/utils/logger');
jest.mock('@/src/utils/preferences', () => ({
    preferences: { defaultCurrencyCode: 'USD' }
}));

describe('JournalService - saveMultiLineEntry', () => {
    let service: JournalService;

    beforeEach(() => {
        service = new JournalService();
        jest.clearAllMocks();

        // Default: Balance valid
        (accountingService.validateJournal as jest.Mock).mockReturnValue({ isValid: true, imbalance: 0 });
        (accountingService.validateDistinctAccounts as jest.Mock).mockReturnValue({ isValid: true });

        // Mock account lookups
        (accountRepository.find as jest.Mock).mockResolvedValue({ id: 'acc1', currencyCode: 'USD' });
        (accountRepository.findAllByIds as jest.Mock).mockResolvedValue([
            { id: 'acc1', currencyCode: 'USD' },
            { id: 'acc2', currencyCode: 'USD' }
        ]);
    });

    describe('saveMultiLineEntry', () => {
        const validLines = [
            { accountId: 'acc1', amount: '100', transactionType: TransactionType.DEBIT, notes: '' },
            { accountId: 'acc2', amount: '100', transactionType: TransactionType.CREDIT, notes: '' }
        ];

        it('should create new journal if no ID provided', async () => {
            // Spy on the internal createJournal which we know saveMultiLineEntry calls
            const createSpy = jest.spyOn(service, 'createJournal').mockResolvedValue({ id: 'j1' } as any);

            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: 'Test Journal',
                journalDate: '2024-01-01',
                journalTime: '12:00:00'
            });

            expect(result.success).toBe(true);
            expect(result.action).toBe('created');
            expect(createSpy).toHaveBeenCalled();
        });

        it('should update existing journal if ID provided', async () => {
            const updateSpy = jest.spyOn(service, 'updateJournal').mockResolvedValue({ id: 'j1' } as any);

            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: 'Updated Journal',
                journalDate: '2024-01-01',
                journalTime: '12:00:00',
                journalId: 'journal123'
            });

            expect(result.success).toBe(true);
            expect(result.action).toBe('updated');
            expect(updateSpy).toHaveBeenCalledWith('journal123', expect.any(Object));
        });

        it('should fail if description is empty', async () => {
            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: '',
                journalDate: '2024-01-01',
                journalTime: '12:00:00'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Description is required');
        });

        it('should fail if journal is unbalanced', async () => {
            (accountingService.validateJournal as jest.Mock).mockReturnValue({ isValid: false, imbalance: 10 });

            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: 'Test',
                journalDate: '2024-01-01',
                journalTime: '12:00:00'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Journal is not balanced');
        });

        it('should fail if accounts are not distinct', async () => {
            (accountingService.validateDistinctAccounts as jest.Mock).mockReturnValue({ isValid: false });

            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: 'Test',
                journalDate: '2024-01-01',
                journalTime: '12:00:00'
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('must involve at least 2 distinct accounts');
        });

        it('should handle errors gracefully', async () => {
            jest.spyOn(service, 'createJournal').mockRejectedValue(new Error('DB Error'));

            const result = await service.saveMultiLineEntry({
                lines: validLines as any,
                description: 'Test',
                journalDate: '2024-01-01',
                journalTime: '12:00:00'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to save transaction');
            expect(logger.error).toHaveBeenCalled();
        });
    });
});
