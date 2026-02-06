import Journal from '@/src/data/models/Journal';
import { CreateJournalData, journalRepository } from '@/src/data/repositories/JournalRepository';
import { journalService, SimpleEntryParams } from '@/src/features/journal/services/JournalService';
import { useCallback } from 'react';

export function useJournalActions() {
    const createJournal = useCallback(async (data: CreateJournalData) => {
        return journalService.createJournal(data);
    }, []);

    const deleteJournal = useCallback(async (journal: Journal) => {
        return journalService.deleteJournal(journal.id);
    }, []);

    const findJournal = useCallback(async (journalId: string) => {
        return journalRepository.find(journalId);
    }, []);

    const updateJournal = useCallback(async (journalId: string, data: CreateJournalData) => {
        return journalService.updateJournal(journalId, data);
    }, []);

    const duplicateJournal = useCallback(async (journalId: string) => {
        return journalService.duplicateJournal(journalId);
    }, []);

    const saveSimpleEntry = useCallback(async (params: SimpleEntryParams) => {
        return journalService.saveSimpleEntry(params);
    }, []);

    return {
        createJournal,
        updateJournal,
        deleteJournal,
        findJournal,
        duplicateJournal,
        saveSimpleEntry,
    };
}
