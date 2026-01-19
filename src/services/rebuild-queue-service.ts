/**
 * Rebuild Queue Service
 * 
 * Batches running balance rebuild operations to prevent UI blocking.
 * Queues account IDs and processes them in batches with debouncing.
 */

import { transactionRepository } from '../data/repositories/TransactionRepository'
import { logger } from '../utils/logger'

interface RebuildQueueConfig {
    debounceMs: number
    maxBatchSize: number
}

const DEFAULT_CONFIG: RebuildQueueConfig = {
    debounceMs: 500,
    maxBatchSize: 10,
}

class RebuildQueueService {
    private queue: Set<string> = new Set()
    private timeoutId: ReturnType<typeof setTimeout> | null = null
    private isProcessing: boolean = false
    private config: RebuildQueueConfig

    constructor(config: Partial<RebuildQueueConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config }
    }

    /**
     * Queue an account for running balance rebuild.
     * The rebuild will be batched with other pending rebuilds.
     */
    enqueue(accountId: string): void {
        this.queue.add(accountId)
        this.scheduleProcessing()
    }

    /**
     * Queue multiple accounts for rebuild.
     */
    enqueueMany(accountIds: string[] | Set<string>): void {
        for (const id of accountIds) {
            this.queue.add(id)
        }
        this.scheduleProcessing()
    }

    /**
     * Force immediate processing of the queue.
     * Useful for critical operations where we need balances ASAP.
     */
    async flush(): Promise<void> {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
        await this.processQueue()
    }

    /**
     * Get the current queue size for debugging/monitoring.
     */
    get pendingCount(): number {
        return this.queue.size
    }

    /**
     * Check if there are pending rebuilds.
     */
    get hasPending(): boolean {
        return this.queue.size > 0 || this.isProcessing
    }

    private scheduleProcessing(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
        }
        this.timeoutId = setTimeout(() => {
            this.processQueue()
        }, this.config.debounceMs)
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.size === 0) {
            return
        }

        this.isProcessing = true
        try {
            // Take up to maxBatchSize items from the queue
            const batch: string[] = []
            for (const accountId of this.queue) {
                batch.push(accountId)
                if (batch.length >= this.config.maxBatchSize) {
                    break
                }
            }

            // Remove processed items from queue
            for (const accountId of batch) {
                this.queue.delete(accountId)
            }

            logger.debug(`[RebuildQueue] Processing batch of ${batch.length} accounts`)

            // Process all accounts in the batch
            const results = await Promise.allSettled(
                batch.map(accountId => transactionRepository.rebuildRunningBalances(accountId))
            )

            // Log any failures
            const failures = results.filter(r => r.status === 'rejected')
            if (failures.length > 0) {
                logger.warn(`[RebuildQueue] ${failures.length}/${batch.length} rebuilds failed`)
            }

            logger.debug(`[RebuildQueue] Batch complete. ${this.queue.size} remaining in queue.`)

            // If there are more items, schedule another processing
            if (this.queue.size > 0) {
                this.scheduleProcessing()
            }
        } catch (error) {
            logger.error('[RebuildQueue] Error processing queue:', error)
        } finally {
            this.isProcessing = false
        }
    }
}

// Singleton instance
export const rebuildQueueService = new RebuildQueueService()

// Export class for testing
export { RebuildQueueService }
