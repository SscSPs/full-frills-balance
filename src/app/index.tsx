import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { accountRepository } from '../data/repositories/AccountRepository'

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    // Load user name and accounts
    const loadUserData = async () => {
      try {
        // Load user name from simple storage
        const storedName = localStorage.getItem('userName')
        setUserName(storedName || 'User')

        // Load accounts from database
        const userAccounts = await accountRepository.findAll()
        setAccounts(userAccounts)
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    }

    loadUserData()
  }, [])

  const handleCreateAccount = () => {
    router.push('/account-creation')
  }

  const handleViewAccounts = () => {
    router.push('/accounts')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, {userName || 'User'}!
          </Text>
          <Text style={styles.subtitle}>
            Here's your financial overview
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{accounts.length}</Text>
            <Text style={styles.statLabel}>Accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>$0.00</Text>
            <Text style={styles.statLabel}>Net Worth</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCreateAccount}
          >
            <Text style={styles.actionButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleViewAccounts}
          >
            <Text style={styles.actionButtonText}>View All Accounts</Text>
          </TouchableOpacity>
        </View>

        {accounts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              You don't have any accounts yet. Create your first account to get started!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
})
