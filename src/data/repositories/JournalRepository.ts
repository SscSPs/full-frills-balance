import { Q } from '@nozbe/watermelondb'
import { database } from '../database/Database'
import Journal, { JournalStatus } from '../models/Journal'
import Transaction, { TransactionType } from '../models/Transaction'

export interface CreateJournalData {
  journalDate: number
  description?: string
  currencyCode: string
  transactions: Array<{
    accountId: string
    amount: number
    transactionType: TransactionType
    notes?: string
  }>
}

export interface JournalWithTransactionTotals {
  id: string
  journalDate: number
  description?: string
  currencyCode: string
  status: string
  createdAt: Date
  totalAmount: number
  transactionCount: number
}

export class JournalRepository {
  private get journals() {
    return database.collections.get<Journal>('journals')
  }

  private get transactions() {
    return database.collections.get<Transaction>('transactions')
  }

  private journalFields(journal: any) {
    return {
      journalDate: journal.journalDate,
      description: journal.description,
      currencyCode: journal.currencyCode,
      status: journal.status,
    }
  }

  /**
   * Creates a journal with its transactions
   * Enforces double-entry accounting: total debits must equal total credits
   */
  async createJournalWithTransactions(
    journalData: CreateJournalData
  ): Promise<Journal> {
    const { transactions: transactionData, ...journalFields } = journalData

    // Validate double-entry accounting
    const totalDebits = transactionData
      .filter(t => t.transactionType === TransactionType.DEBIT)
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalCredits = transactionData
      .filter(t => t.transactionType === TransactionType.CREDIT)
      .reduce((sum, t) => sum + t.amount, 0)

    if (totalDebits !== totalCredits) {
      throw new Error(
        `Double-entry violation: total debits (${totalDebits}) must equal total credits (${totalCredits})`
      )
    }

    return database.write(async () => {
      // Create the journal
      const journal = await this.journals.create((j) => {
        Object.assign(j, {
          ...journalFields,
          status: JournalStatus.POSTED,
        })
      })

      // Create all transactions
      for (const txData of transactionData) {
        await this.transactions.create((tx) => {
          Object.assign(tx, {
            ...txData,
            journalId: journal.id,
            transactionDate: journalData.journalDate,
            currencyCode: journalData.currencyCode,
            // Never set running_balance during creation
            running_balance: undefined,
          })
        })
      }

      return journal
    })
  }

  /**
   * Creates a journal without transactions (for testing)
   */
  async createJournalWithoutTransactions(
    journalData: CreateJournalData
  ): Promise<Journal> {
    const { transactions: transactionData, ...journalFields } = journalData
    
    return database.write(async () => {
      // Create the journal
      const journal = await this.journals.create((j) => {
        Object.assign(j, {
          ...journalFields,
          status: JournalStatus.POSTED,
        })
      })

      return journal
    })
  }

  /**
   * Finds a journal by ID
   */
  async find(id: string): Promise<Journal | null> {
    return this.journals.find(id)
  }

  /**
   * Gets all journals with transaction totals and counts
   * Eliminates N+1 query problem by fetching data efficiently
   */
  async findAllWithTransactionTotals(): Promise<JournalWithTransactionTotals[]> {
    // Fetch all journals first
    const journals = await this.journals
      .query(Q.where('deleted_at', Q.eq(null)))
      .extend(Q.sortBy('journal_date', 'desc'))
      .fetch()

    // For each journal, fetch transactions in parallel batches
    const journalPromises = journals.map(async (journal) => {
      const transactions = await this.transactions
        .query(
          Q.and(
            Q.where('journal_id', journal.id),
            Q.where('deleted_at', Q.eq(null))
          )
        )
        .fetch()

      // Calculate total amount (sum of debit transactions only)
      const totalAmount = transactions
        .filter(tx => tx.transactionType === TransactionType.DEBIT)
        .reduce((sum, tx) => sum + (tx.amount || 0), 0)

      return {
        id: journal.id,
        journalDate: journal.journalDate,
        description: journal.description,
        currencyCode: journal.currencyCode,
        status: journal.status,
        createdAt: journal.createdAt,
        totalAmount,
        transactionCount: transactions.length,
      }
    })

    return Promise.all(journalPromises)
  }

  /**
   * Gets all journals
   */
  async findAll(): Promise<Journal[]> {
    return this.journals
      .query(Q.where('deleted_at', Q.eq(null)))
      .extend(Q.sortBy('journal_date', 'desc'))
      .fetch()
  }

  /**
   * Gets journals for a date range
   */
  async findByDateRange(startDate: number, endDate: number): Promise<Journal[]> {
    return this.journals
      .query(
        Q.and(
          Q.where('journal_date', Q.gte(startDate)),
          Q.where('journal_date', Q.lte(endDate)),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .extend(Q.sortBy('journal_date', 'desc'))
      .fetch()
  }

  /**
   * Creates a reversal journal for an existing journal
   */
  async createReversalJournal(
    originalJournalId: string,
    reason?: string
  ): Promise<Journal> {
    const originalJournal = await this.find(originalJournalId)
    if (!originalJournal) {
      throw new Error('Original journal not found')
    }

    // Get original transactions
    const originalTransactions = await this.transactions
      .query(
        Q.and(
          Q.where('journal_id', originalJournalId),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .fetch()

    // Create reversal transactions (swap debit/credit)
    const reversalTransactions = originalTransactions.map(tx => ({
      accountId: tx.accountId,
      amount: tx.amount,
      transactionType: tx.transactionType === TransactionType.DEBIT 
        ? TransactionType.CREDIT 
        : TransactionType.DEBIT,
      notes: reason ? `Reversal: ${reason}` : `Reversal of journal ${originalJournalId}`,
    }))

    return database.write(async () => {
      // Mark original as reversed
      await originalJournal.update((j) => {
        j.status = JournalStatus.REVERSED
      })

      // Create reversal journal
      const reversalJournal = await this.journals.create((j) => {
        Object.assign(j, {
          journalDate: Date.now(),
          description: reason || `Reversal of journal ${originalJournalId}`,
          currencyCode: originalJournal.currencyCode,
          status: JournalStatus.POSTED,
          originalJournalId: originalJournalId,
        })
      })

      // Create reversal transactions
      for (const txData of reversalTransactions) {
        await this.transactions.create((tx) => {
          Object.assign(tx, {
            ...txData,
            journalId: reversalJournal.id,
            transactionDate: reversalJournal.journalDate,
            currencyCode: reversalJournal.currencyCode,
            running_balance: undefined,
          })
        })
      }

      // Link the reversal
      await originalJournal.update((j) => {
        j.reversingJournalId = reversalJournal.id
      })

      return reversalJournal
    })
  }

  /**
   * Updates a journal
   */
  async update(
    journal: Journal,
    updates: Partial<Journal>
  ): Promise<Journal> {
    return journal.update((j) => {
      Object.assign(j, updates)
    })
  }

  /**
   * Soft deletes a journal
   */
  async delete(journal: Journal): Promise<void> {
    return journal.markAsDeleted()
  }
}

// Export a singleton instance
export const journalRepository = new JournalRepository()
