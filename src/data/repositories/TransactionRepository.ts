import { Q } from '@nozbe/watermelondb'
import { database } from '../database/Database'
import Transaction, { TransactionType } from '../models/Transaction'

export class TransactionRepository {
  private get transactions() {
    return database.collections.get<Transaction>('transactions')
  }

  /**
   * Creates a new transaction
   * @param transactionData Transaction data to create
   * @param enforcePositiveAmount If true, will throw if amount is not positive
   * @returns The created transaction
   * @throws {Error} If amount is not positive and enforcePositiveAmount is true
   */
  async create(
    transactionData: Omit<
      Partial<Transaction>,
      'id' | 'createdAt' | 'updatedAt' | 'running_balance'
    >,
    enforcePositiveAmount = true
  ): Promise<Transaction> {
    // Enforce positive amount invariant
    if (enforcePositiveAmount && transactionData.amount !== undefined && transactionData.amount <= 0) {
      throw new Error('Transaction amount must be positive. Sign is determined by transactionType.')
    }

    return database.write(async () => {
      return this.transactions.create((transaction) => {
        Object.assign(transaction, {
          ...transactionData,
          // Ensure amount is positive
          amount: Math.abs(transactionData.amount || 0),
          // Never set running_balance during creation
          running_balance: undefined,
        })
      })
    })
  }

  /**
   * Rebuilds running balances for an account
   * @param accountId The account ID to rebuild balances for
   * @param upToDate Timestamp to rebuild up to (defaults to now)
   */
  async rebuildRunningBalances(
    accountId: string,
    upToDate: number = Date.now()
  ): Promise<void> {
    // Get all transactions for the account, ordered by date
    const transactions = await this.transactions
      .query(
        Q.and(
          Q.where('account_id', accountId),
          Q.where('transaction_date', Q.lte(upToDate)),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .extend(Q.sortBy('transaction_date', 'asc'))
      .extend(Q.sortBy('created_at', 'asc'))
      .fetch()

    let runningBalance = 0

    // Update each transaction with its running balance
    await database.write(async () => {
      for (const tx of transactions) {
        // Calculate the effect of this transaction
        const amount = tx.transactionType === TransactionType.DEBIT ? -tx.amount : tx.amount
        runningBalance += amount

        // Only update if the balance has changed
        if (tx.runningBalance !== runningBalance) {
          await tx.update((txToUpdate) => {
            txToUpdate.runningBalance = runningBalance
          })
        }
      }
    })
  }

  /**
   * Finds a transaction by ID
   */
  async find(id: string): Promise<Transaction | null> {
    return this.transactions.find(id)
  }

  /**
   * Gets all transactions for an account
   */
  async findByAccount(accountId: string): Promise<Transaction[]> {
    return this.transactions
      .query(
        Q.and(
          Q.where('account_id', accountId),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .extend(Q.sortBy('transaction_date', 'desc'))
      .extend(Q.sortBy('created_at', 'desc'))
      .fetch()
  }

  /**
   * Updates a transaction
   */
  async update(
    transaction: Transaction,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    return transaction.update((tx) => {
      Object.assign(tx, updates)
    })
  }

  /**
   * Soft deletes a transaction
   */
  async delete(transaction: Transaction): Promise<void> {
    return transaction.markAsDeleted()
  }
}

// Export a singleton instance
export const transactionRepository = new TransactionRepository()
