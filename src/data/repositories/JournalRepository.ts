import { Q } from '@nozbe/watermelondb'
import { auditService } from '../../services/audit-service'
import { sanitizeAmount } from '../../utils/validation'
import { database } from '../database/Database'
import Account, { AccountType } from '../models/Account'
import { AuditAction } from '../models/AuditLog'
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
    exchangeRate?: number // For multi-currency transactions
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

    // Validate double-entry accounting by converting transaction amounts to journal currency
    // Formula: journal_amount = account_amount / exchange_rate
    const getJournalAmount = (t: typeof transactionData[0]) => {
      const rate = t.exchangeRate || 1
      return t.amount / rate
    }

    const totalDebits = transactionData
      .filter(t => t.transactionType === TransactionType.DEBIT)
      .reduce((sum, t) => sum + getJournalAmount(t), 0)

    const totalCredits = transactionData
      .filter(t => t.transactionType === TransactionType.CREDIT)
      .reduce((sum, t) => sum + getJournalAmount(t), 0)

    // Validate double-entry accounting with epsilon for floating point noise
    const epsilon = 0.01 // Balances must be within 1 cent in the journal currency
    const difference = Math.abs(totalDebits - totalCredits)

    if (difference > epsilon) {
      throw new Error(
        `Double-entry violation in journal currency: total debits (${totalDebits.toFixed(4)}) must equal total credits (${totalCredits.toFixed(4)}). Difference: ${difference.toFixed(4)}`
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
        const amount = sanitizeAmount(txData.amount) || 0
        await this.transactions.create((tx) => {
          Object.assign(tx, {
            ...txData,
            amount,
            journalId: journal.id,
            transactionDate: journalData.journalDate,
            currencyCode: journalData.currencyCode,
            exchangeRate: txData.exchangeRate,
            // Never set running_balance during creation
            running_balance: undefined,
          })
        })
      }

      // Log audit trail
      await auditService.log({
        entityType: 'journal',
        entityId: journal.id,
        action: AuditAction.CREATE,
        changes: {
          journalDate: journalData.journalDate,
          description: journalData.description,
          currencyCode: journalData.currencyCode,
          transactionCount: transactionData.length,
        },
      })

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
    // Fetch all journals with their transactions in a single query where possible
    const journals = await this.journals
      .query(Q.where('deleted_at', Q.eq(null)))
      .extend(Q.sortBy('journal_date', 'desc'))
      .fetch()

    // Fetch all transactions for these journals in batch
    const journalIds = journals.map(j => j.id)
    const allTransactions = await this.transactions
      .query(
        Q.and(
          Q.where('journal_id', Q.oneOf(journalIds)),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .fetch()

    // Group transactions by journal_id for efficient processing
    const transactionsByJournal = allTransactions.reduce((acc, tx) => {
      if (!acc[tx.journalId]) {
        acc[tx.journalId] = []
      }
      acc[tx.journalId].push(tx)
      return acc
    }, {} as Record<string, typeof allTransactions>)

    // Build results with transaction totals
    return journals.map(journal => {
      const journalTransactions = transactionsByJournal[journal.id] || []

      // Calculate total amount (sum of debit transactions only)
      const totalAmount = journalTransactions
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
        transactionCount: journalTransactions.length,
      }
    })
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

      // Create reversal journal with same date as original for period accuracy
      const reversalJournal = await this.journals.create((j) => {
        Object.assign(j, {
          journalDate: originalJournal.journalDate, // Use original date for period accuracy
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

  /**
   * Gets summary of income and expenses for a specific month
   */
  async getMonthlySummary(month: number, year: number): Promise<{ income: number, expense: number }> {
    const startOfMonth = new Date(year, month, 1).getTime()
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime()

    const txs = await this.transactions
      .query(
        Q.on('journals', Q.and(
          Q.where('status', JournalStatus.POSTED),
          Q.where('deleted_at', Q.eq(null))
        )),
        Q.where('transaction_date', Q.gte(startOfMonth)),
        Q.where('transaction_date', Q.lte(endOfMonth)),
        Q.where('deleted_at', Q.eq(null))
      )
      .fetch() as any[]

    if (txs.length === 0) return { income: 0, expense: 0 }

    const accountIds = Array.from(new Set(txs.map(t => t.accountId)))
    const accounts = await database.collections.get<Account>('accounts')
      .query(Q.where('id', Q.oneOf(accountIds)))
      .fetch()

    const accountTypeMap = accounts.reduce((acc: any, a: any) => {
      acc[a.id] = a.accountType
      return acc
    }, {} as Record<string, AccountType>)

    let totalIncome = 0
    let totalExpense = 0

    txs.forEach(t => {
      const type = accountTypeMap[t.accountId]
      if (type === AccountType.INCOME) {
        // Income increases on CREDIT
        if (t.transactionType === TransactionType.CREDIT) totalIncome += t.amount
        else totalIncome -= t.amount
      } else if (type === AccountType.EXPENSE) {
        // Expense increases on DEBIT
        if (t.transactionType === TransactionType.DEBIT) totalExpense += t.amount
        else totalExpense -= t.amount
      }
    })

    return { income: totalIncome, expense: totalExpense }
  }
}

// Export a singleton instance
export const journalRepository = new JournalRepository()
