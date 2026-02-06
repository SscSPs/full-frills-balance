import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { journalRepository } from '@/src/data/repositories/JournalRepository';
import { journalService } from '@/src/features/journal/services/JournalService';
import { transactionService } from '@/src/features/journal/services/TransactionService';
import { JournalEntryLine } from '@/src/types/domain';
import { showErrorAlert } from '@/src/utils/alerts';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

export interface UseJournalEditorOptions {
    journalId?: string;
    initialMode?: 'simple' | 'advanced';
    initialType?: 'expense' | 'income' | 'transfer';
}

/**
 * useJournalEditor - Controller hook for the Journal Entry screen.
 * Consolidates state management and business logic for both simple and advanced modes.
 */
export function useJournalEditor(options: UseJournalEditorOptions = {}) {
    const router = useRouter();
    const { journalId, initialMode = 'simple', initialType = 'expense' } = options;

    const [isGuidedMode, setIsGuidedMode] = useState(initialMode === 'simple');
    const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer'>(initialType);
    const isEdit = !!journalId;

    // Advanced / Generic state
    const [lines, setLines] = useState<JournalEntryLine[]>([
        { id: '1', accountId: '', accountName: '', accountType: AccountType.ASSET, amount: '', transactionType: TransactionType.DEBIT, notes: '', exchangeRate: '' },
        { id: '2', accountId: '', accountName: '', accountType: AccountType.ASSET, amount: '', transactionType: TransactionType.CREDIT, notes: '', exchangeRate: '' },
    ]);
    const [description, setDescription] = useState('');
    const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0]);
    const [journalTime, setJournalTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEdit);

    // Load initial data for edit mode
    useEffect(() => {
        if (journalId) {
            const loadData = async () => {
                setIsLoading(true);
                try {
                    const journal = await journalRepository.find(journalId);
                    if (journal) {
                        const dateObj = new Date(journal.journalDate);
                        setDescription(journal.description || '');
                        setJournalDate(dateObj.toISOString().split('T')[0]);
                        setJournalTime(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

                        const txs = await transactionService.getEnrichedByJournal(journalId);
                        if (txs.length > 0) {
                            // 1. Force Advanced Mode for multi-leg transactions
                            if (txs.length > 2) {
                                setIsGuidedMode(false);
                            }
                            // 2. Refined Type Detection for 2-leg transactions
                            else if (txs.length === 2) {
                                const creditTx = txs.find(t => t.transactionType === TransactionType.CREDIT);
                                const debitTx = txs.find(t => t.transactionType === TransactionType.DEBIT);

                                if (creditTx && debitTx) {
                                    const sourceIsAssetLiab = creditTx.accountType === AccountType.ASSET || creditTx.accountType === AccountType.LIABILITY;
                                    const destIsExpense = debitTx.accountType === AccountType.EXPENSE;

                                    const sourceIsIncome = creditTx.accountType === AccountType.INCOME;
                                    const destIsAssetLiab = debitTx.accountType === AccountType.ASSET || debitTx.accountType === AccountType.LIABILITY;

                                    if (sourceIsAssetLiab && destIsExpense) {
                                        setTransactionType('expense');
                                    } else if (sourceIsIncome && destIsAssetLiab) {
                                        setTransactionType('income');
                                    } else {
                                        setTransactionType('transfer');
                                    }
                                }
                            }

                            setLines(txs.map(tx => ({
                                id: tx.id,
                                accountId: tx.accountId,
                                accountName: tx.accountName || '',
                                accountType: tx.accountType as AccountType,
                                amount: tx.amount.toString(),
                                transactionType: tx.transactionType as TransactionType,
                                notes: tx.notes || '',
                                exchangeRate: tx.exchangeRate ? tx.exchangeRate.toString() : '',
                                accountCurrency: tx.currencyCode
                            })));
                        }
                    }
                } catch {
                    showErrorAlert('Failed to load transaction');
                } finally {
                    setIsLoading(false);
                }
            };
            loadData();
        }
    }, [journalId]);

    const addLine = useCallback(() => {
        setLines(prev => {
            const ids = prev.map(l => parseInt(l.id)).filter(id => !isNaN(id));
            const nextId = (ids.length > 0 ? Math.max(...ids) + 1 : prev.length + 1).toString();
            return [...prev, {
                id: nextId,
                accountId: '',
                accountName: '',
                accountType: AccountType.ASSET,
                amount: '',
                transactionType: TransactionType.DEBIT,
                notes: '',
                exchangeRate: ''
            }];
        });
    }, []);

    const removeLine = useCallback((id: string) => {
        setLines(prev => {
            if (prev.length <= 2) return prev;
            return prev.filter(l => l.id !== id);
        });
    }, []);

    const updateLine = useCallback((id: string, updates: Partial<JournalEntryLine>) => {
        setLines(prev => prev.map(line =>
            line.id === id ? { ...line, ...updates } : line
        ));
    }, []);

    const submit = async () => {
        setIsSubmitting(true);
        try {
            const result = await journalService.saveMultiLineEntry({
                lines,
                description,
                journalDate,
                journalTime,
                journalId: isEdit ? journalId : undefined
            });

            if (!result.success) {
                showErrorAlert(result.error || 'Unknown error');
                return;
            }

            router.back();
        } catch {
            showErrorAlert('Unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isGuidedMode,
        setIsGuidedMode,
        transactionType,
        setTransactionType,
        isEdit,
        isLoading,
        lines,
        setLines,
        description,
        setDescription,
        journalDate,
        setJournalDate,
        journalTime,
        setJournalTime,
        isSubmitting,
        addLine,
        removeLine,
        updateLine,
        submit
    };
}
