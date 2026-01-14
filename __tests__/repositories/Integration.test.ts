import { database } from '../../src/data/database/Database'
import Account, { AccountType } from '../../src/data/models/Account'
import Currency from '../../src/data/models/Currency'
import { JournalStatus } from '../../src/data/models/Journal'
import { TransactionType } from '../../src/data/models/Transaction'
import { accountRepository } from '../../src/data/repositories/AccountRepository'
import { journalRepository } from '../../src/data/repositories/JournalRepository'
import { transactionRepository } from '../../src/data/repositories/TransactionRepository'

describe('Repository Integration Tests', () => {
  let testAccount: Account
  let testCurrency: Currency

  beforeEach(async () => {
    // Clear database before each test
    await database.write(async () => {
      await database.unsafeResetDatabase()
    })

    // Create test currency
    testCurrency = await database.collections.get<Currency>('currencies').create((currency) => {
      Object.assign(currency, {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        precision: 2,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
    })

    // Create test account
    testAccount = await accountRepository.create({
      name: 'Test Account',
      accountType: AccountType.ASSET,
      currencyCode: 'USD',
      description: 'Test account for integration',
    })
  })

  describe('Journal + Transaction Integration', () => {
    it('should create journal with balanced transactions', async () => {
      const journalData = {
        journalDate: Date.now(),
        description: 'Test journal entry',
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 1000,
            transactionType: TransactionType.DEBIT,
            notes: 'Asset increase',
          },
          {
            accountId: testAccount.id,
            amount: 1000,
            transactionType: TransactionType.CREDIT,
            notes: 'Equity increase',
          },
        ],
      }

      const journal = await journalRepository.createJournalWithTransactions(journalData)

      expect(journal.description).toBe('Test journal entry')
      expect(journal.currencyCode).toBe('USD')
      expect(journal.status).toBe(JournalStatus.POSTED)

      // Verify transactions were created
      const transactions = await transactionRepository.findByAccount(testAccount.id)
      expect(transactions).toHaveLength(2)

      const debitTx = transactions.find(t => t.transactionType === TransactionType.DEBIT)
      const creditTx = transactions.find(t => t.transactionType === TransactionType.CREDIT)

      expect(debitTx?.amount).toBe(1000)
      expect(creditTx?.amount).toBe(1000)
      expect(debitTx?.journalId).toBe(journal.id)
      expect(creditTx?.journalId).toBe(journal.id)
    })

    it('should reject unbalanced journal entries', async () => {
      const journalData = {
        journalDate: Date.now(),
        description: 'Unbalanced journal',
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 1000,
            transactionType: TransactionType.DEBIT,
          },
          {
            accountId: testAccount.id,
            amount: 500, // Unbalanced!
            transactionType: TransactionType.CREDIT,
          },
        ],
      }

      await expect(
        journalRepository.createJournalWithTransactions(journalData)
      ).rejects.toThrow('Double-entry violation')
    })

    it('should create reversal journal', async () => {
      // Create original journal
      const originalJournal = await journalRepository.createJournalWithTransactions({
        journalDate: Date.now(),
        description: 'Original transaction',
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 500,
            transactionType: TransactionType.DEBIT,
          },
          {
            accountId: testAccount.id,
            amount: 500,
            transactionType: TransactionType.CREDIT,
          },
        ],
      })

      // Create reversal
      const reversalJournal = await journalRepository.createReversalJournal(
        originalJournal.id,
        'Mistake in original entry'
      )

      // Verify original is marked as reversed
      const updatedOriginal = await journalRepository.find(originalJournal.id)
      expect(updatedOriginal?.status).toBe(JournalStatus.REVERSED)
      expect(updatedOriginal?.reversingJournalId).toBe(reversalJournal.id)

      // Verify reversal journal
      expect(reversalJournal.originalJournalId).toBe(originalJournal.id)
      expect(reversalJournal.description).toContain('Reversal')

      // Verify reversal transactions (swapped debit/credit)
      const reversalTransactions = await transactionRepository.findByAccount(testAccount.id)
      const originalTx = reversalTransactions.filter(t => t.journalId === originalJournal.id)
      const reversedTx = reversalTransactions.filter(t => t.journalId === reversalJournal.id)

      expect(originalTx).toHaveLength(2)
      expect(reversedTx).toHaveLength(2)

      // Check that debit/credit are swapped
      const originalDebit = originalTx.find(t => t.transactionType === TransactionType.DEBIT)
      const reversedDebit = reversedTx.find(t => t.transactionType === TransactionType.DEBIT)
      
      expect(originalDebit?.transactionType).toBe(TransactionType.DEBIT)
      expect(reversedDebit?.transactionType).toBe(TransactionType.CREDIT) // Swapped!
    })
  })

  describe('Running Balance Rebuild', () => {
    it('should rebuild balances correctly after journal operations', async () => {
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000

      // Create initial journal
      await journalRepository.createJournalWithTransactions({
        journalDate: now - day * 3,
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 1000,
            transactionType: TransactionType.CREDIT,
          },
        ],
      })

      // Create second journal
      await journalRepository.createJournalWithTransactions({
        journalDate: now - day * 2,
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 300,
            transactionType: TransactionType.DEBIT,
          },
        ],
      })

      // Create third journal
      await journalRepository.createJournalWithTransactions({
        journalDate: now - day,
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 200,
            transactionType: TransactionType.CREDIT,
          },
        ],
      })

      // Rebuild running balances
      await transactionRepository.rebuildRunningBalances(testAccount.id)

      // Verify running balances
      const transactions = await transactionRepository.findByAccount(testAccount.id)
      const sortedTxs = transactions.sort((a, b) => a.transactionDate - b.transactionDate)

      expect(sortedTxs[0].runningBalance).toBe(1000)
      expect(sortedTxs[1].runningBalance).toBe(700) // 1000 - 300
      expect(sortedTxs[2].runningBalance).toBe(900) // 700 + 200
    })

    it('should handle soft deletes correctly', async () => {
      // Create transactions
      await journalRepository.createJournalWithTransactions({
        journalDate: Date.now(),
        currencyCode: 'USD',
        transactions: [
          {
            accountId: testAccount.id,
            amount: 1000,
            transactionType: TransactionType.CREDIT,
          },
          {
            accountId: testAccount.id,
            amount: 500,
            transactionType: TransactionType.DEBIT,
          },
        ],
      })

      // Get all transactions
      let allTransactions = await transactionRepository.findByAccount(testAccount.id)
      expect(allTransactions).toHaveLength(2)

      // Soft delete one transaction
      await transactionRepository.delete(allTransactions[0])

      // Verify it's excluded from normal queries
      allTransactions = await transactionRepository.findByAccount(testAccount.id)
      expect(allTransactions).toHaveLength(1)

      // Rebuild balances - should only consider non-deleted transactions
      await transactionRepository.rebuildRunningBalances(testAccount.id)

      const remainingTx = await transactionRepository.findByAccount(testAccount.id)
      expect(remainingTx[0].runningBalance).toBe(-500) // Only the debit remains
    })
  })
})
