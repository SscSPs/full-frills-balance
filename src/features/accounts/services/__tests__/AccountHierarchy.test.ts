import { database } from '@/src/data/database/Database';
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { journalService } from '@/src/features/journal/services/JournalService';
import { balanceService } from '@/src/services/BalanceService';
import { accountService } from '../AccountService';

describe('Account Hierarchy Integration', () => {
    beforeEach(async () => {
        await database.write(async () => {
            await database.unsafeResetDatabase();
        });
    });

    it('should create a parent and child account correctly', async () => {
        const parent = await accountService.createAccount({
            name: 'Parent Asset',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
            icon: 'bank'
        });

        const child = await accountService.createAccount({
            name: 'Child Asset',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
            icon: 'wallet',
            parentAccountId: parent.id
        });

        expect(child.parentAccountId).toBe(parent.id);

        const subAccounts = await parent.subAccounts.fetch();
        expect(subAccounts.length).toBe(1);
        expect(subAccounts[0].id).toBe(child.id);
    });

    it('should aggregate balances from child to parent', async () => {
        const parent = await accountService.createAccount({
            name: 'Parent',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
        });

        const child = await accountService.createAccount({
            name: 'Child',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
            parentAccountId: parent.id,
            initialBalance: 100
        });

        const other = await accountService.createAccount({
            name: 'Other',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
        });

        await journalService.createJournal({
            journalDate: Date.now(),
            description: 'Child Tx',
            currencyCode: 'USD',
            transactions: [
                {
                    accountId: child.id,
                    amount: 50,
                    transactionType: TransactionType.DEBIT
                },
                {
                    accountId: other.id,
                    amount: 50,
                    transactionType: TransactionType.CREDIT
                }
            ]
        });

        const balances = await balanceService.getAccountBalances();
        const parentBalance = balances.find(b => b.accountId === parent.id);
        const childBalance = balances.find(b => b.accountId === child.id);

        expect(childBalance?.balance).toBe(150); // 100 + 50
        expect(parentBalance?.balance).toBe(150); // Aggregated from child
    });

    it('should handle multi-level aggregation (A -> B -> C)', async () => {
        const a = await accountService.createAccount({ name: 'A', accountType: AccountType.ASSET, currencyCode: 'USD' });
        const b = await accountService.createAccount({ name: 'B', accountType: AccountType.ASSET, currencyCode: 'USD', parentAccountId: a.id });
        const c = await accountService.createAccount({ name: 'C', accountType: AccountType.ASSET, currencyCode: 'USD', parentAccountId: b.id });

        const other = await accountService.createAccount({
            name: 'Other',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
        });

        await journalService.createJournal({
            journalDate: Date.now(),
            description: 'C Tx',
            currencyCode: 'USD',
            transactions: [
                {
                    accountId: c.id,
                    amount: 10,
                    transactionType: TransactionType.DEBIT
                },
                {
                    accountId: other.id,
                    amount: 10,
                    transactionType: TransactionType.CREDIT
                }
            ]
        });

        const balances = await balanceService.getAccountBalances();
        const balanceA = balances.find(bl => bl.accountId === a.id);
        const balanceB = balances.find(bl => bl.accountId === b.id);
        const balanceC = balances.find(bl => bl.accountId === c.id);

        expect(balanceC?.balance).toBe(10);
        expect(balanceB?.balance).toBe(10);
        expect(balanceA?.balance).toBe(10);
    });

    it('should prevent circular dependencies (A -> B -> A)', async () => {
        const a = await accountService.createAccount({ name: 'A', accountType: AccountType.ASSET, currencyCode: 'USD' });
        const b = await accountService.createAccount({ name: 'B', accountType: AccountType.ASSET, currencyCode: 'USD', parentAccountId: a.id });

        // Attempting to set A's parent to B should fail
        await expect(accountService.updateAccount(a.id, { parentAccountId: b.id }))
            .rejects.toThrow('Circular parent relationship detected');
    });

    it('should prevent parenting between different account types', async () => {
        const asset = await accountService.createAccount({ name: 'Asset', accountType: AccountType.ASSET, currencyCode: 'USD' });
        const liability = await accountService.createAccount({ name: 'Liability', accountType: AccountType.LIABILITY, currencyCode: 'USD' });

        await expect(accountService.createAccount({
            name: 'Child',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
            parentAccountId: liability.id
        })).rejects.toThrow('Parent account must be of the same type');
    });
});
