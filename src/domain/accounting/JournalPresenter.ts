import { AccountType } from '../../data/models/Account';

export enum JournalDisplayType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
    TRANSFER = 'TRANSFER',
    MIXED = 'MIXED',
}

/**
 * Minimal interface for transaction data needed for journal type classification.
 * Allows both WatermelonDB Transaction models and plain DTOs to be used.
 */
export interface TransactionLike {
    accountId: string;
}

export interface JournalPresentation {
    type: JournalDisplayType;
    label: string;
    colorHex: string; // Using hex or theme key reference
}

export class JournalPresenter {
    /**
     * Determines the high-level type of a journal based on its transactions
     * Logic:
     * - If all transactions are between Assets/Liabilities/Equity -> Transfer
     * - If there are Income accounts -> Income
     * - If there are Expense accounts -> Expense
     * - If both Income and Expense -> Mixed (rare)
     */
    static getJournalType(txs: TransactionLike[], accountTypes: Map<string, AccountType>): JournalDisplayType {
        let hasIncome = false;
        let hasExpense = false;
        let hasAssetLiability = false;

        txs.forEach(tx => {
            const type = accountTypes.get(tx.accountId);
            if (type === AccountType.INCOME) hasIncome = true;
            else if (type === AccountType.EXPENSE) hasExpense = true;
            else hasAssetLiability = true;
        });

        if (hasIncome && hasExpense) return JournalDisplayType.MIXED;
        if (hasIncome) return JournalDisplayType.INCOME;
        if (hasExpense) return JournalDisplayType.EXPENSE;
        return JournalDisplayType.TRANSFER;
    }

    /**
     * Returns display properties for a journal type
     */
    static getPresentation(type: JournalDisplayType, theme: any): JournalPresentation {
        switch (type) {
            case JournalDisplayType.INCOME:
                return { type, label: 'Income', colorHex: theme.success };
            case JournalDisplayType.EXPENSE:
                return { type, label: 'Expense', colorHex: theme.error };
            case JournalDisplayType.TRANSFER:
                return { type, label: 'Transfer', colorHex: theme.primary };
            case JournalDisplayType.MIXED:
            default:
                return { type, label: 'Journal', colorHex: theme.textSecondary };
        }
    }

    /**
     * Simple icon label for the Ivy-style UI
     */
    static getIconLabel(type: JournalDisplayType): string {
        switch (type) {
            case JournalDisplayType.INCOME: return 'I';
            case JournalDisplayType.EXPENSE: return 'E';
            case JournalDisplayType.TRANSFER: return 'T';
            default: return 'J';
        }
    }
}
