import { Q } from '@nozbe/watermelondb'
import { database } from '../database/Database'
import Account, { AccountType } from '../models/Account'

export class AccountRepository {
  private get accounts() {
    return database.collections.get<Account>('accounts')
  }

  /**
   * Creates a new account
   */
  async create(accountData: Omit<
    Partial<Account>,
    'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
  >): Promise<Account> {
    return database.write(async () => {
      return this.accounts.create((account) => {
        Object.assign(account, accountData)
      })
    })
  }

  /**
   * Finds an account by ID
   */
  async find(id: string): Promise<Account | null> {
    return this.accounts.find(id)
  }

  /**
   * Finds an account by name
   */
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

  /**
   * Gets all active accounts
   */
  async findAll(): Promise<Account[]> {
    return this.accounts
      .query(Q.where('deleted_at', Q.eq(null)))
      .fetch()
  }

  /**
   * Gets accounts by type
   */
  async findByType(type: AccountType): Promise<Account[]> {
    return this.accounts
      .query(
        Q.and(
          Q.where('account_type', type),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .fetch()
  }

  /**
   * Gets child accounts of a parent account
   */
  async findChildren(parentAccountId: string): Promise<Account[]> {
    return this.accounts
      .query(
        Q.and(
          Q.where('parent_account_id', parentAccountId),
          Q.where('deleted_at', Q.eq(null))
        )
      )
      .fetch()
  }

  /**
   * Updates an account
   */
  async update(
    account: Account,
    updates: Partial<Account>
  ): Promise<Account> {
    return account.update((acc) => {
      Object.assign(acc, updates)
    })
  }

  /**
   * Soft deletes an account
   */
  async delete(account: Account): Promise<void> {
    return account.markAsDeleted()
  }
}

// Export a singleton instance
export const accountRepository = new AccountRepository()
