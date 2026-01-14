import { Database as WatermelonDB } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId'
import { Platform } from 'react-native'
import { v4 as uuidv4 } from 'uuid'

// Models
import Account from '../models/Account'
import Currency from '../models/Currency'
import Journal from '../models/Journal'
import Transaction from '../models/Transaction'

// Use UUID for IDs instead of numbers
setGenerator(() => uuidv4())

// Import schema and migrations
import { migrations } from './migrations'
import { schema } from './schema'

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: Platform.OS === 'ios', // Enable JSI on iOS for better performance
  onSetUpError: (error) => {
    console.error('Database setup error:', error)
  },
})

// Export the database instance
export const database = new WatermelonDB({
  adapter,
  modelClasses: [
    Account,
    Currency,
    Journal,
    Transaction,
  ],
})
