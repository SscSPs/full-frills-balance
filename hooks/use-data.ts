/**
 * Reactive Data Hooks
 * 
 * Custom hooks that use WatermelonDB observables for real-time data updates.
 */

import Account from '@/src/data/models/Account'
import Journal from '@/src/data/models/Journal'
import Transaction from '@/src/data/models/Transaction'
import { AccountBalance, accountRepository } from '@/src/data/repositories/AccountRepository'
import { Q } from '@nozbe/watermelondb'
import { useDatabase } from '@nozbe/watermelondb/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Hook to reactively get all accounts
 */
export function useAccounts() {
    const database = useDatabase()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const collection = database.collections.get<Account>('accounts')
        const subscription = collection
            .query(Q.where('deleted_at', Q.eq(null)))
            .observe()
            .subscribe((accounts) => {
                setAccounts(accounts)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database])

    return { accounts, isLoading }
}

/**
 * Hook to reactively get accounts by type
 */
export function useAccountsByType(accountType: string) {
    const database = useDatabase()
    const [accounts, setAccounts] = useState<Account[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const collection = database.collections.get<Account>('accounts')
        const subscription = collection
            .query(
                Q.where('account_type', accountType),
                Q.where('deleted_at', Q.eq(null))
            )
            .observe()
            .subscribe((accounts) => {
                setAccounts(accounts)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database, accountType])

    return { accounts, isLoading }
}

/**
 * Hook to reactively get journals with pagination
 * 
 * @param pageSize - Number of journals to load per page (default 50)
 */
export function useJournals(pageSize: number = 50) {
    const database = useDatabase()
    const [journals, setJournals] = useState<Journal[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [currentLimit, setCurrentLimit] = useState(pageSize)

    useEffect(() => {
        const collection = database.collections.get<Journal>('journals')
        const subscription = collection
            .query(
                Q.where('deleted_at', Q.eq(null)),
                Q.sortBy('journal_date', Q.desc),
                Q.take(currentLimit)
            )
            .observe()
            .subscribe((loadedJournals) => {
                setJournals(loadedJournals)
                // If we got fewer than the limit, there are no more
                setHasMore(loadedJournals.length >= currentLimit)
                setIsLoading(false)
                setIsLoadingMore(false)
            })

        return () => subscription.unsubscribe()
    }, [database, currentLimit])

    const loadMore = () => {
        if (isLoadingMore || !hasMore) return
        setIsLoadingMore(true)
        setCurrentLimit(prev => prev + pageSize)
    }

    return { journals, isLoading, isLoadingMore, hasMore, loadMore }
}

/**
 * Enriched transaction data for UI display
 */
export interface EnrichedTransaction {
    id: string
    journalId: string
    amount: number
    transactionType: string
    transactionDate: number
    notes?: string
    journalDescription?: string
    accountName?: string
    accountType?: string
    counterAccountType?: string
    runningBalance?: number
    displayTitle: string
    isIncrease: boolean
}

/**
 * Hook to reactively get transactions for an account
 * Optimized with batch fetching to avoid N+1 queries
 */
export function useAccountTransactions(accountId: string | null) {
    const database = useDatabase()
    const [transactions, setTransactions] = useState<EnrichedTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!accountId) {
            setTransactions([])
            setIsLoading(false)
            return
        }

        const collection = database.collections.get<Transaction>('transactions')
        const subscription = collection
            .query(
                Q.where('account_id', accountId),
                Q.where('deleted_at', Q.eq(null)),
                Q.sortBy('transaction_date', Q.desc)
            )
            .observe()
            .subscribe(async (txs) => {
                if (txs.length === 0) {
                    setTransactions([])
                    setIsLoading(false)
                    return
                }

                // Batch fetch all related data in 3 queries instead of N*3
                const journalIds = [...new Set(txs.map(tx => tx.journalId))]
                const journals = await database.collections.get<Journal>('journals')
                    .query(Q.where('id', Q.oneOf(journalIds)))
                    .fetch()
                const journalMap = new Map(journals.map(j => [j.id, j]))

                // Get the account for this view 
                const account = await database.collections.get<Account>('accounts')
                    .find(accountId)

                // Get all transactions for these journals to find counterparties
                const allJournalTxs = await database.collections.get<Transaction>('transactions')
                    .query(
                        Q.where('journal_id', Q.oneOf(journalIds)),
                        Q.where('deleted_at', Q.eq(null))
                    )
                    .fetch()

                // Get all related accounts for counterparties
                const allAccountIds = [...new Set(allJournalTxs.map(tx => tx.accountId))]
                const allAccounts = await database.collections.get<Account>('accounts')
                    .query(Q.where('id', Q.oneOf(allAccountIds)))
                    .fetch()
                const accountMap = new Map(allAccounts.map(a => [a.id, a]))

                // Group transactions by journal for finding counterparties
                const txsByJournal = new Map<string, Transaction[]>()
                allJournalTxs.forEach(tx => {
                    const existing = txsByJournal.get(tx.journalId) || []
                    existing.push(tx)
                    txsByJournal.set(tx.journalId, existing)
                })

                // Build enriched transactions
                const enriched: EnrichedTransaction[] = txs.map(tx => {
                    const journal = journalMap.get(tx.journalId)
                    const journalTxs = txsByJournal.get(tx.journalId) || []
                    const otherLegs = journalTxs.filter(t => t.accountId !== accountId)

                    let displayTitle = journal?.description || ''
                    let counterAccountType: string | undefined = undefined

                    if (otherLegs.length === 1) {
                        const otherAcc = accountMap.get(otherLegs[0].accountId)
                        displayTitle = otherAcc?.name || journal?.description || 'Offset Entry'
                        counterAccountType = otherAcc?.accountType
                    } else if (otherLegs.length > 1 && !journal?.description) {
                        displayTitle = 'Split'
                    }

                    // Accounting logic for increase/decrease
                    const isDebitIncrease = ['ASSET', 'EXPENSE'].includes(account?.accountType || '')
                    const isIncrease = isDebitIncrease
                        ? tx.transactionType === 'DEBIT'
                        : tx.transactionType === 'CREDIT'

                    return {
                        id: tx.id,
                        journalId: tx.journalId,
                        amount: tx.amount,
                        transactionType: tx.transactionType,
                        transactionDate: tx.transactionDate,
                        notes: tx.notes,
                        journalDescription: journal?.description,
                        accountName: account?.name,
                        accountType: account?.accountType,
                        counterAccountType,
                        runningBalance: tx.runningBalance,
                        displayTitle,
                        isIncrease
                    }
                })

                setTransactions(enriched)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database, accountId])

    return { transactions, isLoading }
}

/**
 * Hook to reactively get transactions for a specific journal with account names
 */
export function useJournalTransactions(journalId: string | null) {
    const database = useDatabase()
    const [transactions, setTransactions] = useState<(Transaction & { accountName?: string })[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!journalId) {
            setTransactions([])
            setIsLoading(false)
            return
        }

        const collection = database.collections.get<Transaction>('transactions')
        const subscription = collection
            .query(
                Q.where('journal_id', journalId),
                Q.where('deleted_at', Q.eq(null))
            )
            .observe()
            .subscribe(async (txs) => {
                // Fetch account names for each transaction
                const enrichedTxs = await Promise.all(txs.map(async (tx) => {
                    const account = await tx.account.fetch()
                    const txWithInfo = tx as any
                    txWithInfo.accountName = account?.name || 'Unknown'
                    return txWithInfo
                }))
                setTransactions(enrichedTxs)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database, journalId])

    return { transactions, isLoading }
}

/**
 * Hook to reactively get a single account by ID
 */
export function useAccount(accountId: string | null) {
    const database = useDatabase()
    const [account, setAccount] = useState<Account | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!accountId) {
            setAccount(null)
            setIsLoading(false)
            return
        }

        const collection = database.collections.get<Account>('accounts')
        const subscription = collection
            .findAndObserve(accountId)
            .subscribe({
                next: (account) => {
                    setAccount(account)
                    setIsLoading(false)
                },
                error: () => {
                    setAccount(null)
                    setIsLoading(false)
                },
            })

        return () => subscription.unsubscribe()
    }, [database, accountId])

    return { account, isLoading }
}

/**
 * Hook to reactively get account balance
 */
export function useAccountBalance(accountId: string | null) {
    const database = useDatabase()
    const [balanceData, setBalanceData] = useState<AccountBalance | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!accountId) {
            setBalanceData(null)
            setIsLoading(false)
            return
        }

        // Re-calculate balance whenever transactions for this account change
        const collection = database.collections.get<Transaction>('transactions')
        const subscription = collection
            .query(Q.where('account_id', accountId))
            .observe()
            .subscribe(async () => {
                try {
                    const data = await accountRepository.getAccountBalance(accountId)
                    setBalanceData(data)
                } catch (error) {
                    console.error('Failed to update account balance:', error)
                } finally {
                    setIsLoading(false)
                }
            })

        return () => subscription.unsubscribe()
    }, [database, accountId])

    return { balanceData, isLoading }
}

/**
 * Hook to reactively get all account balances and net worth
 * 
 * Optimizations:
 * - Debounced recalculation (300ms) to prevent rapid re-renders
 * - Subscribes to accounts (fewer entities, ~10-50) instead of journals (~10k)
 * - Also subscribes to transactions to catch balance changes
 */
export function useNetWorth() {
    const database = useDatabase()
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [data, setData] = useState<{
        balances: AccountBalance[]
        netWorth: number
        totalAssets: number
        totalLiabilities: number
        isLoading: boolean
    }>({
        balances: [],
        netWorth: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        isLoading: true
    })

    useEffect(() => {
        // Calculate net worth with debouncing
        const calculateNetWorth = async () => {
            try {
                const balances = await accountRepository.getAccountBalances()

                let totalAssets = 0
                let totalLiabilities = 0

                balances.forEach(b => {
                    if (b.accountType === 'ASSET') {
                        totalAssets += b.balance
                    } else if (b.accountType === 'LIABILITY') {
                        totalLiabilities += b.balance
                    }
                })

                const netWorth = totalAssets - totalLiabilities

                setData({
                    balances,
                    netWorth,
                    totalAssets,
                    totalLiabilities,
                    isLoading: false
                })
            } catch (error) {
                console.error('Failed to calculate net worth:', error)
                setData(prev => ({ ...prev, isLoading: false }))
            }
        }

        // Debounced calculation
        const debouncedCalculate = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(calculateNetWorth, 300)
        }

        // Subscribe to account changes (account creation/deletion)
        const accountsCollection = database.collections.get<Account>('accounts')
        const accountSubscription = accountsCollection
            .query(Q.where('deleted_at', Q.eq(null)))
            .observe()
            .subscribe(debouncedCalculate)

        // Subscribe to transaction changes (balance updates)
        // This is more targeted than journals - only fires when transactions change
        const transactionsCollection = database.collections.get<Transaction>('transactions')
        const transactionSubscription = transactionsCollection
            .query(Q.where('deleted_at', Q.eq(null)))
            .observe()
            .subscribe(debouncedCalculate)

        // Initial load (immediate, no debounce)
        calculateNetWorth()

        return () => {
            accountSubscription.unsubscribe()
            transactionSubscription.unsubscribe()
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [database])

    return data
}

