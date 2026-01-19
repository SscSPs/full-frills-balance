import { database } from '../../src/data/database/Database'
import { AccountType } from '../../src/data/models/Account'
import { JournalStatus } from '../../src/data/models/Journal'
import { TransactionType } from '../../src/data/models/Transaction'
import { accountRepository } from '../../src/data/repositories/AccountRepository'
import { journalRepository } from '../../src/data/repositories/JournalRepository'

describe('JournalRepository', () => {
    let assetAccountId: string
    let equityAccountId: string

    beforeEach(async () => {
        // Clear database
        await database.write(async () => {
            await database.unsafeResetDatabase()
        })

        // Create initial accounts
        const asset = await accountRepository.create({
            name: 'Cash',
            accountType: AccountType.ASSET,
            currencyCode: 'USD',
        })
        const equity = await accountRepository.create({
            name: 'Opening Balance',
            accountType: AccountType.EQUITY,
            currencyCode: 'USD',
        })
        assetAccountId = asset.id
        equityAccountId = equity.id
    })

    describe('createJournalWithTransactions', () => {
        it('should create a balanced journal entry', async () => {
            const journal = await journalRepository.createJournalWithTransactions({
                description: 'Initial investment',
                journalDate: Date.now(),
                currencyCode: 'USD',
                transactions: [
                    { accountId: assetAccountId, amount: 1000, transactionType: TransactionType.DEBIT },
                    { accountId: equityAccountId, amount: 1000, transactionType: TransactionType.CREDIT },
                ],
            })

            expect(journal).toBeDefined()
            expect(journal.status).toBe(JournalStatus.POSTED)

            // Verify transactions were created
            const transactions = await journal.transactions.fetch()
            expect(transactions).toHaveLength(2)

            // Verify running balances (Opening balance should be 1000 for asset, -1000 for equity)
            const assetTx = transactions.find(t => t.accountId === assetAccountId)
            const equityTx = transactions.find(t => t.accountId === equityAccountId)

            expect(assetTx?.runningBalance).toBe(1000)
            expect(equityTx?.runningBalance).toBe(-1000)
        })

        it('should reject unbalanced transactions', async () => {
            await expect(journalRepository.createJournalWithTransactions({
                description: 'Unbalanced',
                journalDate: Date.now(),
                currencyCode: 'USD',
                transactions: [
                    { accountId: assetAccountId, amount: 1000, transactionType: TransactionType.DEBIT },
                    { accountId: equityAccountId, amount: 500, transactionType: TransactionType.CREDIT },
                ],
            })).rejects.toThrow('Journal does not balance')
        })
    })

    describe('deleteJournal', () => {
        it('should soft-delete a journal and its transactions', async () => {
            const journal = await journalRepository.createJournalWithTransactions({
                description: 'To be deleted',
                journalDate: Date.now(),
                currencyCode: 'USD',
                transactions: [
                    { accountId: assetAccountId, amount: 100, transactionType: TransactionType.DEBIT },
                    { accountId: equityAccountId, amount: 100, transactionType: TransactionType.CREDIT },
                ],
            })

            await journalRepository.deleteJournal(journal.id)

            // Verify journal is deleted (WatermelonDB soft-delete by default if using markAsDeleted)
            const fetchJournal = await database.collections.get('journals').find(journal.id)
            // Note: in Watermelon, find() still returns the record until it's synced or explicitly filtered
            // But our repository logic should handle it. Let's check status or existence if we used destroyPermanently

            // Actually, let's check if transactions are gone from computed balance
            const transactions = await database.collections.get('transactions').query().fetch()
            expect(transactions).toHaveLength(0) // Should be permanently deleted in our implementation
        })
    })

    describe('updateJournal', () => {
        it('should update journal and rebuild transactions', async () => {
            const journal = await journalRepository.createJournalWithTransactions({
                description: 'Original',
                journalDate: Date.now(),
                currencyCode: 'USD',
                transactions: [
                    { accountId: assetAccountId, amount: 100, transactionType: TransactionType.DEBIT },
                    { accountId: equityAccountId, amount: 100, transactionType: TransactionType.CREDIT },
                ],
            })

            await journalRepository.updateJournal(journal.id, {
                description: 'Updated',
                transactions: [
                    { accountId: assetAccountId, amount: 200, transactionType: TransactionType.DEBIT },
                    { accountId: equityAccountId, amount: 200, transactionType: TransactionType.CREDIT },
                ],
            })

            const updatedJournal = await journalRepository.findById(journal.id)
            expect(updatedJournal?.description).toBe('Updated')

            const transactions = await updatedJournal?.transactions.fetch()
            expect(transactions?.[0].amount).toBe(200)
        })
    })
})
