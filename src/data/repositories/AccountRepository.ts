import { database } from '@/src/data/database/Database'
import Account, { AccountType } from '@/src/data/models/Account'
import Transaction from '@/src/data/models/Transaction'
import { ACTIVE_JOURNAL_STATUSES } from '@/src/utils/journalStatus'
import { Q } from '@nozbe/watermelondb'

export interface AccountPersistenceInput {
  name: string
  accountType: AccountType
  currencyCode: string
  description?: string
  orderNum?: number
  parentAccountId?: string
}

export class AccountRepository {
  private get db() {
    return database
  }

  private get accounts() {
    return this.db.collections.get<Account>('accounts')
  }

  /**
   * Reactive Observation Methods
   */

  observeAll(includeDeleted = false) {
    const query = includeDeleted
      ? this.accounts.query(Q.sortBy('order_num', Q.asc))
      : this.accounts.query(Q.where('deleted_at', Q.eq(null)), Q.sortBy('order_num', Q.asc))
    return query.observeWithColumns(['account_type', 'name', 'order_num', 'currency_code'])
  }

  observeByType(accountType: string) {
    const query = this.accounts
      .query(
        Q.where('account_type', accountType),
        Q.where('deleted_at', Q.eq(null)),
        Q.sortBy('order_num', Q.asc)
      )
    return query.observeWithColumns(['name', 'order_num', 'currency_code'])
  }

  observeById(accountId: string) {
    return this.accounts.findAndObserve(accountId)
  }

  /**
   * Observe account balance.
   * Re-emits whenever transactions for this account change OR their parent journals change status.
   */
  observeBalance(accountId: string) {
    return database.collections.get<Transaction>('transactions')
      .query(
        Q.experimentalJoinTables(['journals']),
        Q.where('account_id', accountId),
        Q.on('journals', [
          Q.where('status', Q.oneOf([...ACTIVE_JOURNAL_STATUSES])),
          Q.where('deleted_at', Q.eq(null))
        ])
      )
      .observe()
  }

  /**
   * PURE PERSISTENCE METHODS
   */

  async find(id: string): Promise<Account | null> {
    try {
      return await this.accounts.find(id)
    } catch {
      return null
    }
  }

  async findAllByIds(ids: string[]): Promise<Account[]> {
    if (ids.length === 0) return []
    return this.accounts.query(Q.where('id', Q.oneOf(ids))).fetch()
  }

  async findByName(name: string): Promise<Account | null> {
    const accounts = await this.accounts
      .query(
        Q.and(
          Q.where('name', name),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .fetch()
    return accounts[0] || null
  }

  async findAll(): Promise<Account[]> {
    return this.accounts
      .query(
        Q.where('deleted_at', Q.eq(null)),
        Q.sortBy('order_num', Q.asc)
      )
      .fetch()
  }

  async create(data: AccountPersistenceInput): Promise<Account> {
    return await this.db.write(async () => {
      return this.accounts.create((account) => {
        Object.assign(account, data)
      })
    })
  }

  async update(account: Account, updates: Partial<AccountPersistenceInput>): Promise<Account> {
    return await this.db.write(async () => {
      await account.update((acc) => {
        Object.assign(acc, updates)
      })
      return account
    })
  }

  async delete(account: Account): Promise<void> {
    await this.db.write(async () => {
      await account.update(record => {
        record.deletedAt = new Date()
      })
    })
  }
}

export const accountRepository = new AccountRepository()
