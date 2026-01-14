import { Q } from '@nozbe/watermelondb'
import { database } from '../../src/data/database/Database'
import Transaction, { TransactionType } from '../../src/data/models/Transaction'
import { transactionRepository } from '../../src/data/repositories/TransactionRepository'

describe('TransactionRepository', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await database.write(async () => {
      await database.unsafeResetDatabase()
    })
  })

  describe('create', () => {
    it('should enforce positive amount invariant', async () => {
      // This should throw because amount is negative
      await expect(
        transactionRepository.create({
          accountId: 'test-account',
          amount: -100,
          transactionType: TransactionType.DEBIT,
          currencyCode: 'USD',
          transactionDate: Date.now(),
        })
      ).rejects.toThrow('Transaction amount must be positive')
    })

    it('should store absolute value of amount', async () => {
      const tx = await transactionRepository.create({
        accountId: 'test-account',
        amount: 100,
        transactionType: TransactionType.DEBIT,
        currencyCode: 'USD',
        transactionDate: Date.now(),
      })

      expect(tx.amount).toBe(100)
    })
  })

  describe('rebuildRunningBalances', () => {
    it('should correctly calculate running balances', async () => {
      const accountId = 'test-account'
      const now = Date.now()
      const day = 24 * 60 * 60 * 1000

      // Create test transactions
      await transactionRepository.create({
        accountId,
        amount: 1000,
        transactionType: TransactionType.CREDIT,
        currencyCode: 'USD',
        transactionDate: now - day * 2,
      })

      await transactionRepository.create({
        accountId,
        amount: 500,
        transactionType: TransactionType.DEBIT,
        currencyCode: 'USD',
        transactionDate: now - day,
      })

      await transactionRepository.create({
        accountId,
        amount: 200,
        transactionType: TransactionType.CREDIT,
        currencyCode: 'USD',
        transactionDate: now,
      })

      // Rebuild running balances
      await transactionRepository.rebuildRunningBalances(accountId)

      // Verify running balances
      const transactions = await database.collections
        .get<Transaction>('transactions')
        .query(
          Q.where('account_id', accountId),
          Q.where('deleted_at', Q.eq(null))
        )
        .fetch()

      // Sort by date to ensure correct order
      const sortedTxs = transactions.sort(
        (a, b) => a.transactionDate - b.transactionDate
      )

      expect(sortedTxs[0].runningBalance).toBe(1000)
      expect(sortedTxs[1].runningBalance).toBe(500) // 1000 - 500
      expect(sortedTxs[2].runningBalance).toBe(700) // 500 + 200
    })
  })
})
