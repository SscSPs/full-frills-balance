
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { getEndOfDay, getStartOfDay } from '@/src/utils/dateUtils';

export interface DailyNetWorth {
    date: number; // Start of day timestamp
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
}

export interface ExpenseCategory {
    accountId: string;
    accountName: string;
    amount: number;
    percentage: number;
    color?: string; // For chart
}

export interface IncomeVsExpense {
    period: string; // Label (e.g., "Jan", "Week 1")
    income: number;
    expense: number;
}

export class ReportService {
    /**
     * Calculates Net Worth history for the last N days.
     * 
     * ALGORITHM: "Rewind"
     * 1. Get current balances for all ASSET and LIABILITY accounts.
     * 2. Calculate current Net Worth.
     * 3. Fetch all transactions for these accounts within the date range, sorted DESCENDING.
     * 4. Iterate backward from today, "undoing" transactions to reconstruct daily balances.
     * 
     * Optimizations:
     * - Only fetches relevant account types.
     * - Batches transactions by day.
     */
    /**
     * Calculates Net Worth history for the specified date range.
     * 
     * ALGORITHM: "Rewind"
     * 1. Get current balances for all ASSET and LIABILITY accounts.
     * 2. Calculate current Net Worth.
     * 3. Fetch all transactions for these accounts from (startDate to NOW), sorted DESCENDING.
     * 4. Iterate backward from today, "undoing" transactions.
     * 5. Record daily snapshots when the cursor falls within [startDate, endDate].
     */
    async getNetWorthHistory(startDate: number, endDate: number): Promise<DailyNetWorth[]> {
        // We always start calculation from NOW because balances are "current".
        const calcEndDate = getEndOfDay(Date.now());
        const calcStartDate = getStartOfDay(startDate);

        // We need to rewind from NOW back to startDate. 
        // We will only SAVE snapshots that fall between startDate and endDate.

        const targetEndDate = getEndOfDay(endDate);

        // 1. Get current balances
        const allAccounts = await accountRepository.getAccountBalances();
        const relevantAccounts = allAccounts.filter(a =>
            a.accountType === AccountType.ASSET || a.accountType === AccountType.LIABILITY
        );

        // Calculate CURRENT state (at Date.now())
        let runningAssets = relevantAccounts
            .filter(a => a.accountType === AccountType.ASSET)
            .reduce((sum, a) => sum + a.balance, 0);

        let runningLiabilities = relevantAccounts
            .filter(a => a.accountType === AccountType.LIABILITY)
            .reduce((sum, a) => sum + a.balance, 0);

        const history: DailyNetWorth[] = [];

        // Fetch transactions from NOW back to startDate
        const allTransactions: any[] = [];

        for (const account of relevantAccounts) {
            // We need ALL transactions after startDate to rewind state accurately
            const txs = await transactionRepository.findByAccount(account.accountId);
            const inRangeTxs = txs.filter(t => t.transactionDate >= calcStartDate);
            allTransactions.push(...inRangeTxs);
        }

        // Sort all by date DESC (newest first)
        allTransactions.sort((a, b) => b.transactionDate - a.transactionDate);

        // Iterate day by day backwards from NOW
        const dayMs = 24 * 60 * 60 * 1000;
        const totalDaysToRewind = Math.ceil((calcEndDate - calcStartDate) / dayMs) + 1; // +1 to cover edge

        let txIndex = 0;

        // Current cursor is End of Today
        let cursorDate = calcEndDate;

        // Helper to undo transaction
        const reverseTransaction = (tx: any) => {
            const acc = relevantAccounts.find(a => a.accountId === tx.accountId);
            if (!acc) return;

            let change = 0;
            if (acc.accountType === AccountType.ASSET) {
                // ASSET: DEBIT (+), CREDIT (-) -> Reverse: DEBIT (-), CREDIT (+)
                if (tx.transactionType === TransactionType.DEBIT) change = -tx.amount;
                else change = tx.amount;
                runningAssets += change;
            } else {
                // LIABILITY: DEBIT (-), CREDIT (+) -> Reverse: DEBIT (+), CREDIT (-)
                if (tx.transactionType === TransactionType.CREDIT) change = -tx.amount;
                else change = tx.amount;
                runningLiabilities += change;
            }
        };

        for (let i = 0; i < totalDaysToRewind; i++) {
            const currentDayStart = getStartOfDay(cursorDate);

            // 1. Capture snapshot if this day is within the user's requested range
            if (cursorDate <= targetEndDate && cursorDate >= calcStartDate) {
                history.push({
                    date: currentDayStart,
                    netWorth: runningAssets - runningLiabilities,
                    totalAssets: runningAssets,
                    totalLiabilities: runningLiabilities
                });
            }

            // 2. Undo transactions that happened on this specific day
            while (txIndex < allTransactions.length && allTransactions[txIndex].transactionDate >= currentDayStart) {
                reverseTransaction(allTransactions[txIndex]);
                txIndex++;
            }

            // 3. Move cursor to yesterday
            cursorDate -= dayMs;
        }

        return history.reverse(); // Return Oldest -> Newest
    }

    /**
     * Aggregates expenses by account (Category) for a period.
     */
    async getExpenseBreakdown(startDate: number, endDate: number): Promise<ExpenseCategory[]> {
        // 1. Find all EXPENSE accounts
        const expenseAccounts = await accountRepository.findByType(AccountType.EXPENSE);
        if (expenseAccounts.length === 0) return [];

        const result: ExpenseCategory[] = [];
        let totalExpense = 0;

        for (const account of expenseAccounts) {
            // Get transactions for this account in range
            const txs = await transactionRepository.findByAccount(account.id);
            const inRange = txs.filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate);

            // Sum amount
            // For EXPENSE: DEBIT is increase (spending), CREDIT is refund (decrease).
            const sum = inRange.reduce((acc, t) => {
                if (t.transactionType === TransactionType.DEBIT) return acc + t.amount;
                return acc - t.amount;
            }, 0);

            if (sum > 0) { // Only show positive spending
                result.push({
                    accountId: account.id,
                    accountName: account.name,
                    amount: sum,
                    percentage: 0 // Calc later
                });
                totalExpense += sum;
            }
        }

        // Calculate percentages
        return result.map(c => ({
            ...c,
            percentage: totalExpense > 0 ? (c.amount / totalExpense) * 100 : 0
        })).sort((a, b) => b.amount - a.amount);
    }

    /**
     * Calculates Income vs Expense for the period.
     */
    async getIncomeVsExpense(startDate: number, endDate: number): Promise<{ income: number, expense: number }> {
        // Fetch all Income and Expense accounts
        const incomeAccounts = await accountRepository.findByType(AccountType.INCOME);
        const expenseAccounts = await accountRepository.findByType(AccountType.EXPENSE);

        let totalIncome = 0;
        let totalExpense = 0;

        // Calculate Income
        for (const account of incomeAccounts) {
            const txs = await transactionRepository.findByAccount(account.id);
            const inRange = txs.filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate);
            // INCOME: CREDIT is increase, DEBIT is decrease
            const sum = inRange.reduce((acc, t) => {
                if (t.transactionType === TransactionType.CREDIT) return acc + t.amount;
                return acc - t.amount;
            }, 0);
            totalIncome += sum;
        }

        // Calculate Expense
        for (const account of expenseAccounts) {
            const txs = await transactionRepository.findByAccount(account.id);
            const inRange = txs.filter(t => t.transactionDate >= startDate && t.transactionDate <= endDate);
            // EXPENSE: DEBIT is increase, CREDIT is decrease
            const sum = inRange.reduce((acc, t) => {
                if (t.transactionType === TransactionType.DEBIT) return acc + t.amount;
                return acc - t.amount;
            }, 0);
            totalExpense += sum;
        }

        return { income: totalIncome, expense: totalExpense };
    }
}

export const reportService = new ReportService();
