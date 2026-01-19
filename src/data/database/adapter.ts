import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { migrations } from './migrations'
import { schema } from './schema'

/**
 * Default adapter (LokiJS).
 * used by Jest/Node and Web if adapter.web.ts is not preferred.
 */
const adapter = new LokiJSAdapter({
    schema,
    migrations,
    dbName: 'full-frills-balance',
    useWebWorker: false,
    useIncrementalIndexedDB: typeof process !== 'undefined' && process.env.NODE_ENV !== 'test',
})

export default adapter
