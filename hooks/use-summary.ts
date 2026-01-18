import { database } from '@/src/data/database/Database';
import { AccountType } from '@/src/data/models/Account';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { journalRepository } from '@/src/data/repositories/JournalRepository';
import { useEffect, useState } from 'react';

export interface DashboardSummaryData {
    income: number;
    expense: number;
    netWorth: number;
    isPrivacyMode: boolean;
    togglePrivacyMode: () => void;
}

export const useSummary = () => {
    const [data, setData] = useState<Omit<DashboardSummaryData, 'togglePrivacyMode' | 'isPrivacyMode'>>({
        income: 0,
        expense: 0,
        netWorth: 0,
    });
    const [isPrivacyMode, setIsPrivacyMode] = useState(false);

    const fetchSummary = async () => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const monthly = await journalRepository.getMonthlySummary(month, year);
        const balances = await accountRepository.getAccountBalances();

        const netWorth = balances.reduce((sum, b) => {
            if (b.accountType === AccountType.ASSET) return sum + b.balance;
            if (b.accountType === AccountType.LIABILITY) return sum - b.balance; // Standard: Net Worth = Assets - Liabilities
            return sum;
        }, 0);

        setData({
            income: monthly.income,
            expense: monthly.expense,
            netWorth,
        });
    };

    const togglePrivacyMode = () => setIsPrivacyMode(!isPrivacyMode);

    useEffect(() => {
        fetchSummary();

        // Subscribe to changes in journals and transactions
        const journalSubscription = database.collections.get('journals').query().observe().subscribe(() => {
            fetchSummary();
        });

        const transactionSubscription = database.collections.get('transactions').query().observe().subscribe(() => {
            fetchSummary();
        });

        return () => {
            journalSubscription.unsubscribe();
            transactionSubscription.unsubscribe();
        };
    }, []);

    return {
        ...data,
        isPrivacyMode,
        togglePrivacyMode,
    };
};
