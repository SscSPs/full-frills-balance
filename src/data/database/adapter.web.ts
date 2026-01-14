import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { migrations } from './migrations'
import { schema } from './schema'

const adapter = new LokiJSAdapter({
  schema,
  migrations,
  dbName: 'full-frills-balance',
  useWebWorker: false, // safer with Expo
  useIncrementalIndexedDB: true,
})

export default adapter
