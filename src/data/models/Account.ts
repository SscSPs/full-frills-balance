import { Model } from '@nozbe/watermelondb'
import { children, date, field } from '@nozbe/watermelondb/decorators'

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export default class Account extends Model {
  static table = 'accounts'

  @field('name') name!: string
  @field('account_type') accountType!: AccountType
  @field('currency_code') currencyCode!: string
  @field('parent_account_id') parentAccountId?: string
  @field('description') description?: string
  
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  // Relations
  @children('transactions') transactions!: any
  @children('accounts') subAccounts!: any
}
