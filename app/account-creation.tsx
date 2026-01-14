import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountType } from '@/src/data/models/Account';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

export default function AccountCreationScreen() {
  const { userData, addAccount: addUserAccount } = useUser();
  const [accounts, setAccounts] = useState<Array<{ name: string; type: AccountType; currency: string }>>([]);
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(AccountType.ASSET);
  const [currency, setCurrency] = useState('USD');
  const colorScheme = useColorScheme();

  const accountTypes = Object.values(AccountType);

  const addAccountToList = () => {
    if (accountName.trim()) {
      const newAccount = {
        name: accountName.trim(),
        type: accountType,
        currency: currency
      };
      setAccounts([...accounts, newAccount]);
      setAccountName('');
    }
  };

  const removeAccount = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (accounts.length === 0) {
      Alert.alert('No Accounts', 'Please add at least one account to continue.');
      return;
    }
    
    // Add all accounts to the user context
    accounts.forEach(account => {
      addUserAccount(account);
    });
    
    router.push('/accounts');
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            Create Your Accounts
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Welcome{userData?.userName ? `, ${userData.userName}` : ''}! Let's set up your accounts.
          </ThemedText>

          <View style={styles.formSection}>
            <ThemedText style={styles.label}>Account Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                  color: colorScheme === 'dark' ? '#fff' : '#000'
                }
              ]}
              placeholder="e.g., Checking Account"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={accountName}
              onChangeText={setAccountName}
            />

            <ThemedText style={styles.label}>Account Type</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
              {accountTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    { 
                      backgroundColor: accountType === type ? '#007AFF' : (colorScheme === 'dark' ? '#333' : '#f0f0f0')
                    }
                  ]}
                  onPress={() => setAccountType(type)}
                >
                  <ThemedText style={[
                    styles.typeButtonText,
                    { color: accountType === type ? '#fff' : (colorScheme === 'dark' ? '#fff' : '#000') }
                  ]}>
                    {type.replace('_', ' ')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ThemedText style={styles.label}>Currency</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                  color: colorScheme === 'dark' ? '#fff' : '#000'
                }
              ]}
              placeholder="USD"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={currency}
              onChangeText={setCurrency}
              maxLength={3}
            />

            <TouchableOpacity
              style={[styles.button, styles.addButton]}
              onPress={addAccountToList}
              disabled={!accountName.trim()}
            >
              <ThemedText style={styles.buttonText}>Add Account</ThemedText>
            </TouchableOpacity>
          </View>

          {accounts.length > 0 && (
            <View style={styles.accountsSection}>
              <ThemedText style={styles.sectionTitle}>Accounts to Create</ThemedText>
              {accounts.map((account, index) => (
                <View key={index} style={[
                  styles.accountItem,
                  { backgroundColor: colorScheme === 'dark' ? '#333' : '#f9f9f9' }
                ]}>
                  <View style={styles.accountInfo}>
                    <ThemedText style={styles.accountName}>{account.name}</ThemedText>
                    <ThemedText style={styles.accountDetails}>
                      {account.type.replace('_', ' ')} • {account.currency}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeAccount(index)}
                  >
                    <ThemedText style={styles.removeButtonText}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              styles.continueButton,
              { backgroundColor: accounts.length > 0 ? '#007AFF' : '#ccc' }
            ]}
            onPress={handleContinue}
            disabled={accounts.length === 0}
          >
            <ThemedText style={styles.buttonText}>Continue to Dashboard</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  formSection: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  typeSelector: {
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#34C759',
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
