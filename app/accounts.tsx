import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountType } from '@/src/data/models/Account';
import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useUser } from '../contexts/UserContext';

interface AccountData {
  name: string;
  type: AccountType;
  currency: string;
}

export default function AccountsScreen() {
  const { userData } = useUser();
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();

  const accountList = userData?.accounts || [];

  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you'd fetch fresh data from your database
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return 'banknote';
      case AccountType.LIABILITY:
        return 'creditcard';
      case AccountType.EQUITY:
        return 'chart.line.uptrend.xyaxis';
      case AccountType.INCOME:
        return 'arrow.down.circle';
      case AccountType.EXPENSE:
        return 'arrow.up.circle';
      default:
        return 'questionmark.circle';
    }
  };

  const getAccountTypeColor = (type: AccountType) => {
    switch (type) {
      case AccountType.ASSET:
        return '#34C759';
      case AccountType.LIABILITY:
        return '#FF3B30';
      case AccountType.EQUITY:
        return '#007AFF';
      case AccountType.INCOME:
        return '#34C759';
      case AccountType.EXPENSE:
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <ThemedText type="title" style={styles.welcomeText}>
            Welcome{userData?.userName ? `, ${userData.userName}` : ''}!
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Here are your accounts
          </ThemedText>
        </View>

        {accountList.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="folder" size={64} color="#8E8E93" />
            <ThemedText style={styles.emptyStateTitle}>No Accounts Yet</ThemedText>
            <ThemedText style={styles.emptyStateDescription}>
              You haven't created any accounts. Let's get started!
            </ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/account-creation')}
            >
              <ThemedText style={styles.createButtonText}>Create Your First Account</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.accountsContainer}>
            <View style={styles.accountsHeader}>
              <ThemedText style={styles.accountsTitle}>Your Accounts</ThemedText>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/account-creation')}
              >
                <IconSymbol name="plus" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {accountList.map((account, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.accountCard,
                  { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }
                ]}
              >
                <View style={styles.accountLeft}>
                  <View style={[
                    styles.accountIcon,
                    { backgroundColor: getAccountTypeColor(account.type) + '20' }
                  ]}>
                    <IconSymbol
                      name={getAccountTypeIcon(account.type)}
                      size={24}
                      color={getAccountTypeColor(account.type)}
                    />
                  </View>
                  <View style={styles.accountInfo}>
                    <ThemedText style={styles.accountName}>{account.name}</ThemedText>
                    <ThemedText style={styles.accountType}>
                      {account.type.replace('_', ' ')}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.accountRight}>
                  <ThemedText style={styles.currency}>{account.currency}</ThemedText>
                  <IconSymbol name="chevron.right" size={16} color="#8E8E93" />
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addAccountCard}
              onPress={() => router.push('/account-creation')}
            >
              <IconSymbol name="plus.circle" size={24} color="#007AFF" />
              <ThemedText style={styles.addAccountText}>Add Another Account</ThemedText>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="arrow.up.circle" size={32} color="#FF3B30" />
              <ThemedText style={styles.actionText}>Add Expense</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="arrow.down.circle" size={32} color="#34C759" />
              <ThemedText style={styles.actionText}>Add Income</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="arrow.left.arrow.right" size={32} color="#007AFF" />
              <ThemedText style={styles.actionText}>Transfer</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="chart.bar" size={32} color="#8E8E93" />
              <ThemedText style={styles.actionText}>Reports</ThemedText>
            </TouchableOpacity>
          </View>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountsContainer: {
    padding: 20,
  },
  accountsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 14,
    opacity: 0.7,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  addAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  addAccountText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
});
