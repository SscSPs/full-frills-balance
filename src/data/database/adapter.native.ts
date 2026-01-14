import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { Platform } from 'react-native'

import { migrations } from './migrations'
import { schema } from './schema'

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: Platform.OS === 'ios', // iOS only
  onSetUpError: (error) => {
    console.error('Database setup error:', error)
  },
})

export default adapter
