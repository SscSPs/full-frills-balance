import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'accounts',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'account_type', type: 'string' }, // ASSET, LIABILITY, etc.
        { name: 'currency_code', type: 'string', isIndexed: true },
        { name: 'parent_account_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true, isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'currencies',
      columns: [
        { name: 'code', type: 'string', isIndexed: true },
        { name: 'symbol', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'precision', type: 'number' },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true, isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'journals',
      columns: [
        { name: 'journal_date', type: 'number', isIndexed: true }, // timestamp
        { name: 'description', type: 'string', isOptional: true },
        { name: 'currency_code', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' }, // POSTED, REVERSED
        { name: 'original_journal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'reversing_journal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true, isIndexed: true },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'journal_id', type: 'string', isIndexed: true },
        { name: 'account_id', type: 'string', isIndexed: true },
        { name: 'amount', type: 'number' }, // in minor units, always positive
        { name: 'transaction_type', type: 'string' }, // DEBIT or CREDIT
        { name: 'currency_code', type: 'string', isIndexed: true },
        { name: 'transaction_date', type: 'number', isIndexed: true }, // timestamp
        { name: 'notes', type: 'string', isOptional: true },
        // Note: running_balance is a cache that can be rebuilt from transactions
        // It should only be written by rebuild process, not during normal operations
        { name: 'running_balance', type: 'number', isOptional: true, isIndexed: false },
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true, isIndexed: true },
      ],
    }),
  ],
})
