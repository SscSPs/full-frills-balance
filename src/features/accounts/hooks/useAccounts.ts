/**
 * Reactive Data Hooks for Accounts
 */
import Account, { AccountType } from '@/src/data/models/Account'
import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { useObservable, useObservableWithEnrichment } from '@/src/hooks/useObservable'
import { AccountBalance } from '@/src/types/domain'
import { useCallback, useMemo } from 'react'
import { combineLatest, of } from 'rxjs'

/**
 * Hook to reactively get all accounts
 */
export function useAccounts() {
    const { data: accounts, isLoading, version } = useObservable(
        () => accountRepository.observeAll(),
        [],
        [] as Account[]
    )
    return { accounts, isLoading, version }
}

/**
 * Hook to reactively get accounts by type
 */
export function useAccountsByType(accountType: string) {
    const { data: accounts, isLoading, version } = useObservable(
        () => accountRepository.observeByType(accountType),
        [accountType],
        [] as Account[]
    )
    return { accounts, isLoading, version }
}

/**
 * Hook to reactively get a single account by ID
 */
export function useAccount(accountId: string | null) {
    const { data: account, isLoading, version } = useObservable(
        () => accountId ? accountRepository.observeById(accountId) : of(null),
        [accountId],
        null as Account | null
    )
    return { account, isLoading, version }
}

/**
 * Hook to reactively get account balance
 */
export function useAccountBalance(accountId: string | null) {
    // Use a stable empty observable when accountId is null
    const stableAccountId = useMemo(() => accountId, [accountId])

    const { data: balanceData, isLoading, version } = useObservableWithEnrichment(
        () => stableAccountId ? combineLatest([
            accountRepository.observeById(stableAccountId),
            accountRepository.observeBalance(stableAccountId)
        ]) : of(null),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        async () => {
            if (!stableAccountId) return null;
            const { balanceService } = require('@/src/services/BalanceService');
            return balanceService.getAccountBalance(stableAccountId);
        },
        [stableAccountId],
        null as AccountBalance | null
    )
    return { balanceData, isLoading, version }
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
        initialBalance?: number;
    }) => {
        const { accountService } = require('@/src/services/AccountService');
        return accountService.createAccount(data)
    }, [])

    const updateAccount = useCallback(async (account: Account, data: {
        name?: string;
        accountType?: AccountType;
        currencyCode?: string;
        description?: string;
    }) => {
        const { accountService } = require('@/src/services/AccountService');
        return accountService.updateAccount(account.id, data)
    }, [])

    const deleteAccount = useCallback(async (account: Account) => {
        const { accountService } = require('@/src/services/AccountService');
        return accountService.deleteAccount(account)
    }, [])

    const recoverAccount = useCallback(async (accountId: string) => {
        const { accountService } = require('@/src/services/AccountService');
        return accountService.recoverAccount(accountId)
    }, [])

    const updateAccountOrder = useCallback(async (account: Account, newOrder: number) => {
        const { accountService } = require('@/src/services/AccountService');
        return accountService.updateAccountOrder(account, newOrder)
    }, [])

    return {
        createAccount,
        updateAccount,
        deleteAccount,
        recoverAccount,
        updateAccountOrder
    }
}
