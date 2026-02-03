import Journal from '@/src/data/models/Journal';
import { CreateJournalData } from '@/src/data/repositories/JournalRepository';
import { journalService } from '@/src/services/JournalService';
import { useCallback } from 'react';

export function useJournalActions() {
    const createJournal = useCallback(async (data: CreateJournalData) => {
        return journalService.createJournal(data);
    }, []);

    const deleteJournal = useCallback(async (journal: Journal) => {
        return journalService.deleteJournal(journal.id);
    }, []);

    const findJournal = useCallback(async (journalId: string) => {
        // Find is still fine on repository as it's a simple read
        const { journalRepository } = require('@/src/data/repositories/JournalRepository');
        return journalRepository.find(journalId);
    }, []);

    const updateJournal = useCallback(async (journalId: string, data: CreateJournalData) => {
        // TODO: Implement updateJournal in JournalService
        const { journalRepository } = require('@/src/data/repositories/JournalRepository');
        return journalRepository.updateJournalWithTransactions(journalId, data);
    }, []);

    const duplicateJournal = useCallback(async (journalId: string) => {
        // TODO: Implement duplicateJournal in JournalService
        const { journalRepository } = require('@/src/data/repositories/JournalRepository');
        return journalRepository.duplicateJournal(journalId);
    }, []);

    return {
        createJournal,
        updateJournal,
        deleteJournal,
        findJournal,
        duplicateJournal,
    };
}
