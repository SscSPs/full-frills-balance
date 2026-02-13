import Account, { AccountType } from '@/src/data/models/Account';
import { useAccountSelection } from '@/src/features/journal/hooks/useAccountSelection';
import { useJournalActions } from '@/src/features/journal/hooks/useJournalActions';
import { useExchangeRate } from '@/src/hooks/useExchangeRate';
import { logger } from '@/src/utils/logger';
import { preferences } from '@/src/utils/preferences';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type TabType = 'expense' | 'income' | 'transfer';

export interface UseSimpleJournalEditorProps {
    accounts: Account[];
    onSuccess: () => void;
    journalId?: string;
    initialType?: TabType;
    initialAmount?: string;
    initialSourceId?: string;
    initialDestinationId?: string;
    initialDate?: string;
    initialTime?: string;
    initialDescription?: string;
}

/**
 * useSimpleJournalEditor - Controller hook for the simple journal form.
 * Handles state, basic validation, and exchange rate calculations.
 */
export function useSimpleJournalEditor({
    accounts,
    onSuccess,
    journalId,
    initialType = 'expense',
    initialAmount = '',
    initialSourceId = '',
    initialDestinationId = '',
    initialDate = new Date().toISOString().split('T')[0],
    initialTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    initialDescription = '',
}: UseSimpleJournalEditorProps) {
    const { saveSimpleEntry } = useJournalActions();
    const { fetchRate } = useExchangeRate();

    const [type, setType] = useState<TabType>(initialType);
    const [amount, setAmount] = useState(initialAmount);
    const [sourceId, setSourceId] = useState<string>(initialSourceId);
    const [destinationId, setDestinationId] = useState<string>(initialDestinationId);
    const [journalDate, setJournalDate] = useState(initialDate);
    const [journalTime, setJournalTime] = useState(initialTime);
    const [description, setDescription] = useState(initialDescription);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [exchangeRate, setExchangeRate] = useState<number | null>(null);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);

    // Use shared account selection logic for filtering
    const {
        transactionAccounts,
        expenseAccounts,
        incomeAccounts,
    } = useAccountSelection({ accounts });

    const sourceAccount = useMemo(() => accounts.find(a => a.id === sourceId), [accounts, sourceId]);
    const destAccount = useMemo(() => accounts.find(a => a.id === destinationId), [accounts, destinationId]);

    const sourceCurrency = useMemo(() => sourceAccount?.currencyCode, [sourceAccount]);
    const destCurrency = useMemo(() => destAccount?.currencyCode, [destAccount]);

    const isCrossCurrency = !!(sourceCurrency && destCurrency && sourceCurrency !== destCurrency);

    // Rate calculations
    useEffect(() => {
        const fetchCurrentRate = async () => {
            if (!isCrossCurrency || !sourceCurrency || !destCurrency) {
                setExchangeRate(null);
                return;
            }

            setIsLoadingRate(true);
            setRateError(null);
            try {
                const rate = await fetchRate(sourceCurrency, destCurrency);
                setExchangeRate(rate);
            } catch (error) {
                setRateError('Rate unavailable');
                logger.error('Failed to fetch rate', { sourceCurrency, destCurrency, error });
            } finally {
                setIsLoadingRate(false);
            }
        };

        fetchCurrentRate();
    }, [isCrossCurrency, sourceCurrency, destCurrency, fetchRate]);

    const numAmount = useMemo(() => {
        return parseFloat(amount.replace(/[^0-9.]/g, '')) || 0;
    }, [amount]);

    const convertedAmount = useMemo(() => {
        if (!isCrossCurrency || !exchangeRate) return numAmount;
        return numAmount * exchangeRate;
    }, [numAmount, isCrossCurrency, exchangeRate]);

    // Account reset logic on type change
    useEffect(() => {
        const lastSourceId = preferences.lastUsedSourceAccountId;
        const lastDestId = preferences.lastUsedDestinationAccountId;

        if (type === 'expense') {
            if (!sourceId || !transactionAccounts.some(a => a.id === sourceId)) {
                setSourceId(lastSourceId && transactionAccounts.some(a => a.id === lastSourceId) ? lastSourceId : '');
            }
            if (!destinationId || accounts.find(a => a.id === destinationId)?.accountType !== AccountType.EXPENSE) {
                setDestinationId('');
            }
        } else if (type === 'income') {
            if (!destinationId || !transactionAccounts.some(a => a.id === destinationId)) {
                setDestinationId(lastDestId && transactionAccounts.some(a => a.id === lastDestId) ? lastDestId : '');
            }
            if (!sourceId || accounts.find(a => a.id === sourceId)?.accountType !== AccountType.INCOME) {
                setSourceId('');
            }
        } else {
            // Transfer
            if (!sourceId) setSourceId(lastSourceId || '');
            if (!destinationId) setDestinationId(lastDestId || '');
        }
    }, [type, accounts, transactionAccounts, sourceId, destinationId]);

    const handleSave = useCallback(async () => {
        if (numAmount <= 0) return;
        if (!sourceId || !destinationId) return;

        setIsSubmitting(true);
        try {
            await saveSimpleEntry({
                type,
                amount: numAmount,
                sourceId,
                destinationId,
                journalDate: new Date(`${journalDate}T${journalTime}`).getTime(),
                description: description || undefined,
                exchangeRate: (isCrossCurrency && exchangeRate) ? exchangeRate : undefined,
                journalId
            });

            if (type === 'expense' || type === 'transfer') await preferences.setLastUsedSourceAccountId(sourceId);
            if (type === 'income' || type === 'transfer') await preferences.setLastUsedDestinationAccountId(destinationId);

            setAmount('');
            onSuccess();
        } catch (error) {
            logger.error('Failed to save:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [numAmount, sourceId, destinationId, saveSimpleEntry, type, journalDate, journalTime, description, isCrossCurrency, exchangeRate, journalId, onSuccess]);

    return {
        type,
        setType: (t: TabType) => {
            setType(t);
            setSourceId('');
            setDestinationId('');
        },
        amount,
        setAmount,
        sourceId,
        setSourceId,
        destinationId,
        setDestinationId,
        journalDate,
        setJournalDate,
        journalTime,
        setJournalTime,
        description,
        setDescription,
        isSubmitting,
        exchangeRate,
        isLoadingRate,
        rateError,
        isCrossCurrency,
        convertedAmount,
        transactionAccounts,
        expenseAccounts,
        incomeAccounts,
        sourceAccount,
        destAccount,
        sourceCurrency,
        destCurrency,
        handleSave,
    };
}
