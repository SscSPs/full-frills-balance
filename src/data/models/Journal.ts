import { Model } from '@nozbe/watermelondb'
import { children, date, field } from '@nozbe/watermelondb/decorators'

export enum JournalStatus {
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export default class Journal extends Model {
  static table = 'journals'

  @field('journal_date') journalDate!: number
  @field('description') description?: string
  @field('currency_code') currencyCode!: string
  @field('status') status!: JournalStatus
  @field('original_journal_id') originalJournalId?: string
  @field('reversing_journal_id') reversingJournalId?: string
  
  @date('created_at') createdAt!: Date
  @date('updated_at') updatedAt!: Date
  @date('deleted_at') deletedAt?: Date

  // Relations
  @children('transactions') transactions!: any
}
