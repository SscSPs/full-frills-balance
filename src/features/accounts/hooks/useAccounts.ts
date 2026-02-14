/**
 * Reactive Data Hooks for Accounts
 */
import { Animation } from '@/src/constants'
import { useUI } from '@/src/contexts/UIContext'
import Account, { AccountType } from '@/src/data/models/Account'
import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository'
import { journalRepository } from '@/src/data/repositories/JournalRepository'
import { transactionRepository } from '@/src/data/repositories/TransactionRepository'
import { accountService } from '@/src/features/accounts/services/AccountService'
import { useObservable } from '@/src/hooks/useObservable'
import { balanceService } from '@/src/services/BalanceService'
import { AccountBalance } from '@/src/types/domain'
import { useCallback } from 'react'
import { combineLatest, debounceTime, from, Observable, of, switchMap } from 'rxjs'

interface BalancesByAccountIdMap {
    [accountId: string]: AccountBalance
}

/**
 * Hook to reactively get all accounts
 */
export function useAccounts() {
    const { data: accounts, isLoading, version, error } = useObservable(
        () => accountRepository.observeAll(),
        [],
        [] as Account[]
    )
    return { accounts, isLoading, version, error }
}

/**
 * Hook to reactively get accounts by type
 */
export function useAccountsByType(accountType: string) {
    const { data: accounts, isLoading, version, error } = useObservable(
        () => accountRepository.observeByType(accountType),
        [accountType],
        [] as Account[]
    )
    return { accounts, isLoading, version, error }
}

/**
 * Hook to reactively get a single account by ID
 */
export function useAccount(accountId: string | null) {
    const { data: account, isLoading, version, error } = useObservable(
        () => accountId ? accountRepository.observeById(accountId) : of(null),
        [accountId],
        null as Account | null
    )
    return { account, isLoading, version, error }
}

/**
 * Hook to reactively get account balance.
 * Uses PURE REACTIVITY: No async enrichment, no race conditions.
 * Calculates sum in-memory for instant consistency.
 */
export function useAccountBalance(accountId: string | null) {
    const { defaultCurrency } = useUI()
    const { data: balanceData, isLoading, version, error } = useObservable(
        () => {
            if (!accountId) return of(null)

            return accountRepository.observeById(accountId).pipe(
                switchMap(account => {
                    if (!account) return of(null)

                    // 1. Get descendant IDs and their account objects (needed for currencies/precisions)
                    const descendants$ = from(accountRepository.getDescendantIds(account.id)).pipe(
                        switchMap(ids => ids.length > 0 ? accountRepository.observeByIds(ids) : of([] as Account[]))
                    );

                    return combineLatest([
                        descendants$,
                        currencyRepository.observeAll(),
                        journalRepository.observeStatusMeta()
                    ]).pipe(
                        switchMap(([descendantAccounts, currencies]) => {
                            const allAccounts = [account, ...descendantAccounts];
                            const allAccountIds = allAccounts.map(a => a.id);
                            const precisionMap = new Map(currencies.map(c => [c.code, c.precision]));

                            // 2. Observe all transactions for this entire sub-tree
                            return transactionRepository.observeByAccounts(allAccountIds, 1000).pipe(
                                switchMap(async transactions => { // Changed map to switchMap and made callback async
                                    const balances = await balanceService.calculateBalancesFromTransactions(
                                        allAccounts,
                                        transactions,
                                        precisionMap,
                                        defaultCurrency
                                    );
                                    return balances.get(account.id) || null;
                                })
                            );
                        })
                    );
                })
            )
        },
        [accountId, defaultCurrency],
        null as AccountBalance | null
    )

    return { balanceData, isLoading, version, error }
}

/**
 * Hook to reactively compute balances for a list of accounts.
 * Supports async balance aggregation with currency conversion.
 */
export function useAccountBalances(accounts: Account[]) {
    const { defaultCurrency } = useUI()

    const { data: balancesByAccountId, isLoading, version, error } = useObservable<Map<string, AccountBalance>>(
        () => {
            if (accounts.length === 0) {
                return of(new Map<string, AccountBalance>())
            }

            const currencies$ = currencyRepository.observeAll()
            const transactions$ = transactionRepository.observeActiveWithColumns([
                'amount',
                'transaction_type',
                'account_id',
                'transaction_date',
                'currency_code',
                'exchange_rate'
            ])

            return combineLatest([currencies$, transactions$]).pipe(
                debounceTime(Animation.dataRefreshDebounce),
                switchMap(([currencies, transactions]): Observable<Map<string, AccountBalance>> => from((async () => {
                    const precisionMap = new Map(currencies.map((currency) => [currency.code, currency.precision]))
                    return await balanceService.calculateBalancesFromTransactions(
                        accounts,
                        transactions,
                        precisionMap,
                        defaultCurrency
                    )
                })()))
            )
        },
        [accounts, defaultCurrency],
        new Map<string, AccountBalance>()
    )

    return { balancesByAccountId, isLoading, version, error }
}

/**
 * Hook for account actions (mutations)
 * Consolidated: provides CRUD operations and management actions
 */
export function useAccountActions() {
    const createAccount = useCallback(async (data: {
        name: string;
        accountType: AccountType;
        currencyCode: string;
        icon?: string;
        initialBalance?: number;
        parentAccountId?: string | null;
    }) => {
        return accountService.createAccount(data)
    }, [])

    const updateAccount = useCallback(async (account: Account, data: {
        name?: string;
        accountType?: AccountType;
        currencyCode?: string;
        description?: string;
        icon?: string;
        parentAccountId?: string | null;
    }) => {
        return accountService.updateAccount(account.id, data)
    }, [])

    const deleteAccount = useCallback(async (account: Account) => {
        return accountService.deleteAccount(account)
    }, [])

    const recoverAccount = useCallback(async (accountId: string) => {
        return accountService.recoverAccount(accountId)
    }, [])

    const updateAccountOrder = useCallback(async (account: Account, newOrder: number) => {
        return accountService.updateAccountOrder(account, newOrder)
    }, [])

    const findAccountByName = useCallback(async (name: string) => {
        return accountService.findAccountByName(name)
    }, [])

    const adjustBalance = useCallback(async (account: Account, targetBalance: number) => {
        return accountService.adjustBalance(account, targetBalance)
    }, [])

    return {
        createAccount,
        updateAccount,
        deleteAccount,
        recoverAccount,
        updateAccountOrder,
        findAccountByName,
        adjustBalance
    }
}
