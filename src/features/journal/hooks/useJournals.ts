/**
 * Reactive Data Hooks for Journal/Transactions
 */
import { journalRepository } from '@/src/data/repositories/JournalRepository'
import { useAccount } from '@/src/features/accounts/hooks/useAccounts'
import { usePaginatedObservable } from '@/src/hooks/usePaginatedObservable'
import { EnrichedJournal, EnrichedTransaction } from '@/src/types/domain'
import { useEffect, useMemo, useState } from 'react'

/**
 * Hook to reactively get journals with pagination and account enrichment
 */
export function useJournals(pageSize: number = 50, dateRange?: { startDate: number, endDate: number }) {
    const { items: journals, isLoading, isLoadingMore, hasMore, loadMore } = usePaginatedObservable<any, EnrichedJournal>({
        pageSize,
        dateRange,
        observe: (limit, range) => {
            const { journalsObservable } = journalRepository.observeEnrichedJournals(limit, range)
            return journalsObservable
        },
        enrich: (_, limit, range) => journalRepository.findEnrichedJournals(limit, range),
        secondaryObserve: () => {
            const { transactionsObservable } = journalRepository.observeEnrichedJournals(1, undefined)
            return transactionsObservable
        },
    })

    return { journals, isLoading, isLoadingMore, hasMore, loadMore }
}


/**
 * Custom hook to get reactively updated transactions for an account
 * 
 * Note: This hook uses usePaginatedObservable with account-specific filtering.
 * It also observes the account itself to ensure name/type changes trigger re-enrichment.
 */
export function useAccountTransactions(accountId: string, pageSize: number = 50, dateRange?: { startDate: number, endDate: number }) {
    // Observe the account itself to detect property changes (name, type)
    const { account } = useAccount(accountId)

    // Create a composite date range that includes accountId and account versioning properties
    // for proper filter change detection and re-enrichment
    const compositeRange = useMemo(() => {
        if (!dateRange) return { accountVersion: `${account?.name}-${account?.accountType}` } as any
        return {
            ...dateRange,
            accountId,
            accountVersion: `${account?.name}-${account?.accountType}`
        } as { startDate: number, endDate: number, accountId?: string, accountVersion?: string }
    }, [dateRange, accountId, account?.name, account?.accountType])

    const { items: transactions, isLoading, isLoadingMore, hasMore, loadMore, version } = usePaginatedObservable<any, EnrichedTransaction>({
        pageSize,
        dateRange: compositeRange,
        observe: (limit, range) => journalRepository.observeAccountTransactions(
            accountId,
            limit,
            range && 'startDate' in range ? { startDate: range.startDate, endDate: range.endDate } : undefined
        ),
        enrich: (_, limit, range) => journalRepository.findEnrichedTransactionsForAccount(
            accountId,
            limit,
            range && 'startDate' in range ? { startDate: range.startDate, endDate: range.endDate } : undefined
        ),
        // Secondary observe ensures we pick up *other* transaction changes too
        secondaryObserve: () => journalRepository.observeAccountTransactions(accountId, 1, undefined)
    })

    return { transactions, isLoading, isLoadingMore, hasMore, loadMore, version }
}


/**
 * Hook to reactively get transactions for a specific journal with account names
 */
export function useJournalTransactions(journalId: string | null) {
    const [transactions, setTransactions] = useState<EnrichedTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!journalId) {
            setTransactions([])
            setIsLoading(false)
            return
        }

        const subscription = journalRepository
            .observeJournalTransactions(journalId)
            .subscribe(async () => {
                const enrichedTxs = await journalRepository.findEnrichedTransactionsByJournal(journalId)
                setTransactions(enrichedTxs)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [journalId])

    return { transactions, isLoading }
}
