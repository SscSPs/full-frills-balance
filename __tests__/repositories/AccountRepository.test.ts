import { database } from '../../src/data/database/Database'
import Account, { AccountType } from '../../src/data/models/Account'
import Transaction, { TransactionType } from '../../src/data/models/Transaction'
import { AccountRepository } from '../../src/data/repositories/AccountRepository'

// Mock data setup helpers
const createMockAccount = async (type: AccountType, name: string = 'Test Account') => {
  return await database.write(async () => {
    return await database.collections.get<Account>('accounts').create(account => {
      account.name = name
      account.accountType = type
      account.currencyCode = 'USD'
    })
  })
}

const createMockTransaction = async (accountId: string, amount: number, type: TransactionType) => {
  return await database.write(async () => {
    return await database.collections.get<Transaction>('transactions').create(tx => {
      tx.accountId = accountId
      tx.amount = amount
      tx.transactionType = type
      tx.currencyCode = 'USD'
      tx.transactionDate = Date.now()
    })
  })
}

describe('AccountRepository.getAccountBalance', () => {
  let accountRepository: AccountRepository
  let testAssetAccount: Account
  let testLiabilityAccount: Account

  beforeEach(async () => {
    accountRepository = new AccountRepository()
    
    // Create test accounts
    testAssetAccount = await createMockAccount(AccountType.ASSET, 'Test Asset')
    testLiabilityAccount = await createMockAccount(AccountType.LIABILITY, 'Test Liability')
  })

  afterEach(async () => {
    // Clean up database
    await database.write(async () => {
      await database.collections.get<Account>('accounts').query().destroyAllPermanently()
      await database.collections.get<Transaction>('transactions').query().destroyAllPermanently()
    })
  })

  describe('Asset account behavior', () => {
    it('should increase balance with debits', async () => {
      // Create a debit transaction (increases asset balance)
      await createMockTransaction(testAssetAccount.id, 100, TransactionType.DEBIT)
      
      const balance = await accountRepository.getAccountBalance(testAssetAccount.id)
      
      expect(balance.balance).toBe(100)
      expect(balance.transactionCount).toBe(1)
      expect(balance.accountType).toBe(AccountType.ASSET)
    })

    it('should decrease balance with credits', async () => {
      // Create initial debit
      await createMockTransaction(testAssetAccount.id, 200, TransactionType.DEBIT)
      // Create credit transaction (decreases asset balance)
      await createMockTransaction(testAssetAccount.id, 50, TransactionType.CREDIT)
      
      const balance = await accountRepository.getAccountBalance(testAssetAccount.id)
      
      expect(balance.balance).toBe(150) // 200 - 50
      expect(balance.transactionCount).toBe(2)
    })

    it('should handle zero balance correctly', async () => {
      // Create equal debits and credits
      await createMockTransaction(testAssetAccount.id, 100, TransactionType.DEBIT)
      await createMockTransaction(testAssetAccount.id, 100, TransactionType.CREDIT)
      
      const balance = await accountRepository.getAccountBalance(testAssetAccount.id)
      
      expect(balance.balance).toBe(0)
      expect(balance.transactionCount).toBe(2)
    })
  })

  describe('Liability account behavior', () => {
    it('should increase balance with credits', async () => {
      // Create a credit transaction (increases liability balance)
      await createMockTransaction(testLiabilityAccount.id, 100, TransactionType.CREDIT)
      
      const balance = await accountRepository.getAccountBalance(testLiabilityAccount.id)
      
      expect(balance.balance).toBe(100)
      expect(balance.accountType).toBe(AccountType.LIABILITY)
    })

    it('should decrease balance with debits', async () => {
      // Create initial credit
      await createMockTransaction(testLiabilityAccount.id, 200, TransactionType.CREDIT)
      // Create debit transaction (decreases liability balance)
      await createMockTransaction(testLiabilityAccount.id, 50, TransactionType.DEBIT)
      
      const balance = await accountRepository.getAccountBalance(testLiabilityAccount.id)
      
      expect(balance.balance).toBe(150) // 200 - 50
      expect(balance.transactionCount).toBe(2)
    })
  })

  describe('Point-in-time balance correctness', () => {
    it('should calculate balance as of specific date', async () => {
      const baseTime = Date.now()
      
      // Create transaction at base time
      await createMockTransaction(testAssetAccount.id, 100, TransactionType.DEBIT)
      
      // Wait a bit then create another transaction
      await new Promise(resolve => setTimeout(resolve, 10))
      const laterTime = Date.now()
      await createMockTransaction(testAssetAccount.id, 50, TransactionType.CREDIT)
      
      // Balance as of base time should only include first transaction
      const balanceAsOfBase = await accountRepository.getAccountBalance(testAssetAccount.id, baseTime)
      expect(balanceAsOfBase.balance).toBe(100)
      expect(balanceAsOfBase.transactionCount).toBe(1)
      expect(balanceAsOfBase.asOfDate).toBe(baseTime)
      
      // Balance with no date limit should include both
      const currentBalance = await accountRepository.getAccountBalance(testAssetAccount.id)
      expect(currentBalance.balance).toBe(150)
      expect(currentBalance.transactionCount).toBe(2)
    })
  })

  describe('Error handling', () => {
    it('should throw error for non-existent account', async () => {
      await expect(
        accountRepository.getAccountBalance('non-existent-id')
      ).rejects.toThrow('Account non-existent-id not found')
    })
  })
})
