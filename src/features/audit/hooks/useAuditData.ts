import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { useObservable } from '@/src/hooks/useObservable'
import React from 'react'

export function useAuditAccounts() {
    const { data: accounts, isLoading } = useObservable(
        () => accountRepository.observeAll(),
        [],
        []
    )

    const accountMap = React.useMemo(() => {
        const map: Record<string, { name: string; currency: string }> = {}
        accounts.forEach(acc => {
            map[acc.id] = { name: acc.name, currency: acc.currencyCode }
        })
        return map
    }, [accounts])

    return { accountMap, isLoading }
}
