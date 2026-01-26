import { Database as WatermelonDB } from '@nozbe/watermelondb'
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId'
import { generator } from './idGenerator'

// Models
import Account from '../models/Account'
import AuditLog from '../models/AuditLog'
import Currency from '../models/Currency'
import ExchangeRate from '../models/ExchangeRate'
import Journal from '../models/Journal'
import Transaction from '../models/Transaction'

// Adapter (platform-specific resolution handled by Metro)
import adapter from './adapter'

// Use Native Crypto for IDs (58x faster)
// Use Native Crypto for IDs (58x faster) if available
if (generator) {
  setGenerator(generator)
}

export const database = new WatermelonDB({
  adapter,
  modelClasses: [
    Account,
    AuditLog,
    Currency,
    ExchangeRate,
    Journal,
    Transaction,
  ],
})
