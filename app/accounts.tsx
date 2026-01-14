import Account, { AccountType } from '@/src/data/models/Account'
import { accountRepository } from '@/src/data/repositories/AccountRepository'
import { showErrorAlert } from '@/src/utils/alerts'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function AccountsScreen() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const userAccounts = await accountRepository.findAll()
        setAccounts(userAccounts)
      } catch (error) {
        showErrorAlert(error, 'Failed to Load Accounts')
      } finally {
        setIsLoading(false)
      }
    }

    loadAccounts()
  }, [])

  const handleCreateJournal = () => {
    router.push('/journal-entry' as any)
  }

  const handleViewJournals = () => {
    router.push('/journal-list' as any)
  }

  const handleCreateAccount = () => {
    router.push('/account-creation' as any)
  }

  const handleAccountPress = (account: Account) => {
    // For now, just show basic account info
    // TODO: Navigate to account details screen
    const formattedDate = new Date(account.createdAt).toLocaleDateString()
    const message = `Type: ${account.accountType}\nCurrency: ${account.currencyCode}\nCreated: ${formattedDate}`
    
    // Use a simple alert for now - could replace with a modal
    alert(`${account.name}\n\n${message}`)
  }

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return '#007AFF'
      case AccountType.LIABILITY:
        return '#FF6B6B'
      case AccountType.EQUITY:
        return '#10B981'
      case AccountType.INCOME:
        return '#059669'
      case AccountType.EXPENSE:
        return '#DC3545'
      default:
        return '#666'
    }
  }

  const renderAccount = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.accountCard}
      onPress={() => handleAccountPress(item)}
    >
      <View style={styles.accountHeader}>
        <Text style={styles.accountName}>{item.name}</Text>
        <View style={[styles.accountTypeBadge, { backgroundColor: getAccountTypeColor(item.accountType) }]}>
          <Text style={styles.accountTypeText}>{item.accountType}</Text>
        </View>
      </View>
      <Text style={styles.accountCurrency}>{item.currencyCode}</Text>
    </TouchableOpacity>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading accounts...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Accounts</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.journalListButton]}
            onPress={handleViewJournals}
          >
            <Text style={styles.headerButtonText}>📋 Journals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, styles.journalButton]}
            onPress={handleCreateJournal}
          >
            <Text style={styles.headerButtonText}>+ Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, styles.createButton]}
            onPress={handleCreateAccount}
          >
            <Text style={styles.headerButtonText}>+ Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No accounts yet. Create your first account to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccount}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  journalButton: {
    backgroundColor: '#10B981',
  },
  journalListButton: {
    backgroundColor: '#8B5CF6',
  },
  createButton: {
    backgroundColor: '#007AFF',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContainer: {
    paddingHorizontal: 24,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  accountTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accountTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  accountCurrency: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
})
