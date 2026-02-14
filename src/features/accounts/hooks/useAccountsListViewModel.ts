import { useUI } from '@/src/contexts/UIContext'
import { transformAccountsToSections } from '@/src/features/accounts/utils/transformAccounts'
import { useWealthSummary } from '@/src/features/wealth'
import { useTheme } from '@/src/hooks/use-theme'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

export interface AccountSectionViewModel {
    title: string
    count: number
    totalDisplay: string
    totalColor: string
    isCollapsed: boolean
    data: any[]
}

export interface AccountsListViewModel {
    sections: AccountSectionViewModel[]
    isRefreshing: boolean
    onRefresh: () => void
    onToggleSection: (title: string) => void
    onAccountPress: (accountId: string) => void
    onCollapseAccount: (accountId: string) => void
    onCreateAccount: () => void
    onReorderPress: () => void
    onManageHierarchy: () => void
    onTogglePrivacy: () => void
    isPrivacyMode: boolean
}

export function useAccountsListViewModel(): AccountsListViewModel {
    const router = useRouter()
    const { theme } = useTheme()
    const { defaultCurrency, showAccountMonthlyStats, isPrivacyMode, setPrivacyMode } = useUI()

    const {
        accounts,
        balancesMap: balancesByAccountId,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalIncome,
        totalExpense,
        isLoading,
    } = useWealthSummary()
    const togglePrivacyMode = useCallback(() => setPrivacyMode(!isPrivacyMode), [isPrivacyMode, setPrivacyMode])

    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['Equity']))
    const [expandedAccountIds, setExpandedAccountIds] = useState<Set<string>>(new Set())

    const onToggleSection = useCallback((title: string) => {
        setCollapsedSections(prev => {
            const next = new Set(prev)
            if (next.has(title)) next.delete(title)
            else next.add(title)
            return next
        })
    }, [])

    const onAccountPress = useCallback((accountId: string) => {
        const account = accounts.find(a => a.id === accountId)
        if (!account) return

        const hasChildren = accounts.some(a => a.parentAccountId === accountId)
        const isExpanded = expandedAccountIds.has(accountId)

        if (hasChildren && !isExpanded) {
            // Expanding first if it has children and is collapsed
            setExpandedAccountIds(prev => {
                const next = new Set(prev)
                next.add(accountId)
                return next
            })
        } else {
            // Navigation to details if no children OR already expanded
            router.push(`/account-details?accountId=${accountId}`)
        }
    }, [router, accounts, expandedAccountIds])

    const onCollapseAccount = useCallback((accountId: string) => {
        setExpandedAccountIds(prev => {
            const next = new Set(prev)
            next.delete(accountId)
            return next
        })
    }, [])

    const onCreateAccount = useCallback(() => {
        router.push('/account-creation')
    }, [router])

    const onReorderPress = useCallback(() => {
        router.push('/account-reorder')
    }, [router])

    const onTogglePrivacy = useCallback(() => {
        togglePrivacyMode()
    }, [togglePrivacyMode])

    const onManageHierarchy = useCallback(() => {
        router.push('/manage-hierarchy')
    }, [router])

    const onRefresh = useCallback(() => {
        // Refresh is handled reactively by useWealthSummary observables
    }, []);

    const sections = useMemo(() => {
        return transformAccountsToSections(accounts, {
            balancesByAccountId,
            defaultCurrency,
            showAccountMonthlyStats,
            isPrivacyMode,
            isLoading,
            collapsedSections,
            expandedAccountIds,
            theme,
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalIncome,
            totalExpense,
        })
    }, [
        accounts,
        balancesByAccountId,
        defaultCurrency,
        showAccountMonthlyStats,
        isPrivacyMode,
        isLoading,
        collapsedSections,
        expandedAccountIds,
        theme,
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalIncome,
        totalExpense,
    ])

    return {
        sections,
        isRefreshing: isLoading,
        onRefresh,
        onToggleSection,
        onAccountPress,
        onCollapseAccount,
        onCreateAccount,
        onReorderPress,
        onManageHierarchy,
        onTogglePrivacy,
        isPrivacyMode,
    }
}
