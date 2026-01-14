import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AccountType } from '../data/models/Account'
import { accountRepository } from '../data/repositories/AccountRepository'

export default function AccountCreationScreen() {
  const router = useRouter()
  const [accountName, setAccountName] = useState('')
  const [accountType, setAccountType] = useState<AccountType>(AccountType.ASSET)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateAccount = async () => {
    if (!accountName.trim()) {
      Alert.alert('Account Name Required', 'Please enter an account name.')
      return
    }

    setIsCreating(true)
    
    try {
      await accountRepository.create({
        name: accountName.trim(),
        accountType: accountType,
        currencyCode: 'USD', // Default to USD for now
        description: `Created via onboarding`,
      })

      Alert.alert(
        'Account Created',
        `"${accountName.trim()}" has been created successfully!`,
        [
          { text: 'Create Another', onPress: () => setAccountName('') },
          { text: 'Continue', onPress: () => router.push('/') },
        ]
      )
    } catch (error) {
      console.error('Failed to create account:', error)
      Alert.alert('Error', 'Failed to create account. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const accountTypes = [
    { key: AccountType.ASSET, label: 'Asset' },
    { key: AccountType.LIABILITY, label: 'Liability' },
    { key: AccountType.EQUITY, label: 'Equity' },
    { key: AccountType.INCOME, label: 'Income' },
    { key: AccountType.EXPENSE, label: 'Expense' },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Create Your First Account</Text>
        <Text style={styles.subtitle}>Start tracking your finances</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Name</Text>
          <TextInput
            style={styles.input}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="e.g., Checking Account"
            autoFocus
            maxLength={100}
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.accountTypeContainer}>
            {accountTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.accountTypeButton,
                  accountType === type.key && styles.accountTypeButtonSelected
                ]}
                onPress={() => setAccountType(type.key as AccountType)}
              >
                <Text style={[
                  styles.accountTypeText,
                  accountType === type.key && styles.accountTypeTextSelected
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!accountName.trim() || isCreating) && styles.buttonDisabled]}
          onPress={handleCreateAccount}
          disabled={!accountName.trim() || isCreating}
        >
          <Text style={styles.buttonText}>
            {isCreating ? 'Creating...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  accountTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  accountTypeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  accountTypeButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  accountTypeText: {
    fontSize: 14,
    color: '#333',
  },
  accountTypeTextSelected: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
