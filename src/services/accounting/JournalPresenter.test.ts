import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { JournalDisplayType, JournalPresenter, SemanticType } from '@/src/services/accounting/JournalPresenter';

describe('JournalPresenter', () => {
    const accountTypes = new Map<string, AccountType>([
        ['a1', AccountType.ASSET],
        ['a2', AccountType.ASSET],
        ['l1', AccountType.LIABILITY],
        ['e1', AccountType.EQUITY],
        ['i1', AccountType.INCOME],
        ['ex1', AccountType.EXPENSE],
    ]);

    const theme = {
        success: '#success',
        error: '#error',
        primary: '#primary',
        textSecondary: '#secondary',
    };

    describe('getJournalDisplayType', () => {
        it('identifies INCOME when an Income account is involved', () => {
            const txs = [
                { accountId: 'a1', transactionType: TransactionType.DEBIT },
                { accountId: 'i1', transactionType: TransactionType.CREDIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.INCOME);
        });

        it('identifies EXPENSE when an Expense account is involved', () => {
            const txs = [
                { accountId: 'ex1', transactionType: TransactionType.DEBIT },
                { accountId: 'a1', transactionType: TransactionType.CREDIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.EXPENSE);
        });

        it('identifies MIXED when both Income and Expense accounts are involved', () => {
            const txs = [
                { accountId: 'i1', transactionType: TransactionType.CREDIT },
                { accountId: 'ex1', transactionType: TransactionType.DEBIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.MIXED);
        });

        it('identifies TRANSFER for simple Asset-to-Asset movements', () => {
            const txs = [
                { accountId: 'a1', transactionType: TransactionType.CREDIT },
                { accountId: 'a2', transactionType: TransactionType.DEBIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.TRANSFER);
        });

        it('identifies INCOME for Asset Debit vs Equity Credit (Investment)', () => {
            const txs = [
                { accountId: 'a1', transactionType: TransactionType.DEBIT },
                { accountId: 'e1', transactionType: TransactionType.CREDIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.INCOME);
        });

        it('identifies EXPENSE for Asset Credit vs Equity Debit (Owner Draw)', () => {
            const txs = [
                { accountId: 'a1', transactionType: TransactionType.CREDIT },
                { accountId: 'e1', transactionType: TransactionType.DEBIT },
            ];
            expect(JournalPresenter.getJournalDisplayType(txs, accountTypes)).toBe(JournalDisplayType.EXPENSE);
        });
    });

    describe('getSemanticType', () => {
        it('identifies Asset -> Asset as Transfer', () => {
            expect(JournalPresenter.getSemanticType(AccountType.ASSET, AccountType.ASSET)).toBe(SemanticType.TRANSFER);
        });

        it('identifies Income -> Asset as Income', () => {
            expect(JournalPresenter.getSemanticType(AccountType.INCOME, AccountType.ASSET)).toBe(SemanticType.INCOME);
        });

        it('identifies Asset -> Expense as Expense', () => {
            expect(JournalPresenter.getSemanticType(AccountType.ASSET, AccountType.EXPENSE)).toBe(SemanticType.EXPENSE);
        });

        it('identifies Asset -> Liability as Debt Payment', () => {
            expect(JournalPresenter.getSemanticType(AccountType.ASSET, AccountType.LIABILITY)).toBe(SemanticType.DEBT_PAYMENT);
        });

        it('identifies Liability -> Asset as New Debt', () => {
            expect(JournalPresenter.getSemanticType(AccountType.LIABILITY, AccountType.ASSET)).toBe(SemanticType.NEW_DEBT);
        });

        it('returns UNKNOWN for invalid types (though types are enforced)', () => {
            expect(JournalPresenter.getSemanticType('INVALID' as any, AccountType.ASSET)).toBe(SemanticType.UNKNOWN);
        });
    });

    describe('getPresentation', () => {
        it('returns correct presentation for INCOME', () => {
            const pres = JournalPresenter.getPresentation(JournalDisplayType.INCOME, theme);
            expect(pres.colorHex).toBe(theme.success);
            expect(pres.label).toBe('Income');
        });

        it('overrides label with semanticLabel if provided', () => {
            const pres = JournalPresenter.getPresentation(JournalDisplayType.INCOME, theme, 'Salary');
            expect(pres.label).toBe('Salary');
        });
    });

    describe('getAccountColorKey', () => {
        it('returns correct key for ASSET', () => {
            expect(JournalPresenter.getAccountColorKey(AccountType.ASSET)).toBe('asset');
        });

        it('returns correct key for LIABILITY', () => {
            expect(JournalPresenter.getAccountColorKey(AccountType.LIABILITY)).toBe('liability');
        });
    });

    describe('getIconLabel', () => {
        it('returns I for INCOME', () => {
            expect(JournalPresenter.getIconLabel(JournalDisplayType.INCOME)).toBe('I');
        });
        it('returns E for EXPENSE', () => {
            expect(JournalPresenter.getIconLabel(JournalDisplayType.EXPENSE)).toBe('E');
        });
        it('returns T for TRANSFER', () => {
            expect(JournalPresenter.getIconLabel(JournalDisplayType.TRANSFER)).toBe('T');
        });
    });
});
