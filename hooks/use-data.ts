/**
 * Reactive Data Hooks
 * 
 * Custom hooks that use WatermelonDB observables for real-time data updates.
 */

import Account from '@/src/data/models/Account'
import Journal from '@/src/data/models/Journal'
import Transaction from '@/src/data/models/Transaction'
import { Q } from '@nozbe/watermelondb'
import { useDatabase } from '@nozbe/watermelondb/react'
import { useEffect, useState } from 'react'

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
 * Hook to reactively get all journals
 */
export function useJournals() {
    const database = useDatabase()
    const [journals, setJournals] = useState<Journal[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const collection = database.collections.get<Journal>('journals')
        const subscription = collection
            .query(
                Q.where('deleted_at', Q.eq(null)),
                Q.sortBy('journal_date', Q.desc)
            )
            .observe()
            .subscribe((journals) => {
                setJournals(journals)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database])

    return { journals, isLoading }
}

/**
 * Hook to reactively get transactions for an account
 */
export function useAccountTransactions(accountId: string | null) {
    const database = useDatabase()
    const [transactions, setTransactions] = useState<Transaction[]>([])
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
            .subscribe((transactions) => {
                setTransactions(transactions)
                setIsLoading(false)
            })

        return () => subscription.unsubscribe()
    }, [database, accountId])

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
