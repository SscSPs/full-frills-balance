import Account, { AccountType } from '@/src/data/models/Account';
import { getAccountSections } from '@/src/utils/accountUtils';
import { useCallback, useMemo, useState } from 'react';

export interface UseAccountSelectionOptions {
    accounts: Account[];
    initialSelectedId?: string;
    onSelect?: (id: string) => void;
}

/**
 * useAccountSelection - Shared logic for filtering and selecting accounts.
 * Used by both modal selectors and inline tile lists.
 */
export function useAccountSelection({ accounts, initialSelectedId, onSelect }: UseAccountSelectionOptions) {
    const [selectedId, setSelectedId] = useState(initialSelectedId || '');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    const handleSelect = useCallback((id: string) => {
        setSelectedId(id);
        onSelect?.(id);
    }, [onSelect]);

    const toggleSection = useCallback((title: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev);
            if (next.has(title)) {
                next.delete(title);
            } else {
                next.add(title);
            }
            return next;
        });
    }, []);

    const sections = useMemo(() => {
        return getAccountSections(accounts);
    }, [accounts]);

    const transactionAccounts = useMemo(() => {
        return accounts.filter(a => a.accountType === AccountType.ASSET || a.accountType === AccountType.LIABILITY);
    }, [accounts]);

    const expenseAccounts = useMemo(() => accounts.filter(a => a.accountType === AccountType.EXPENSE), [accounts]);
    const incomeAccounts = useMemo(() => accounts.filter(a => a.accountType === AccountType.INCOME), [accounts]);

    return {
        selectedId,
        setSelectedId,
        handleSelect,
        sections,
        collapsedSections,
        toggleSection,
        transactionAccounts,
        expenseAccounts,
        incomeAccounts,
    };
}
