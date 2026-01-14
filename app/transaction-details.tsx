import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { TransactionType } from '@/src/data/models/Transaction';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { TransactionWithAccountInfo } from '@/src/types/readModels';
import { showErrorAlert } from '@/src/utils/alerts';
import { formatDate } from '@/src/utils/dateUtils';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TransactionDetailsProps {
  journalId: string;
}

export default function TransactionDetailsScreen({ journalId }: TransactionDetailsProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e9ecef', dark: '#333' }, 'background');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');
  
  const [transactions, setTransactions] = useState<TransactionWithAccountInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setIsLoading(true);
        // Use new repository-owned read model
        const journalTransactions = await transactionRepository.findByJournalWithAccountInfo(journalId);
        setTransactions(journalTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        showErrorAlert(error, 'Failed to Load Transactions');
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [journalId]);

  const renderTransaction = ({ item: transaction }: { item: TransactionWithAccountInfo }) => {
    const formattedDate = formatDate(transaction.transactionDate, { includeTime: true });
    const formattedAmount = Math.abs(transaction.amount).toFixed(2);
    const formattedRunningBalance = transaction.runningBalance !== undefined 
      ? transaction.runningBalance.toFixed(2) 
      : null;
    const transactionTypeColor = transaction.transactionType === TransactionType.DEBIT ? '#DC3545' : '#10B981';
    
    return (
      <View style={[styles.transactionCard, { backgroundColor: cardBackground, borderColor }]}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <ThemedText style={styles.accountName}>{transaction.accountName}</ThemedText>
            <ThemedText style={styles.accountType}>{transaction.accountType}</ThemedText>
          </View>
          <View style={styles.transactionTypeBadge}>
            <ThemedText style={[styles.transactionTypeText, { color: transactionTypeColor }]}>
              {transaction.transactionType}
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.transactionDetails}>
          <ThemedText style={styles.transactionDate}>{formattedDate}</ThemedText>
          <View style={styles.amountContainer}>
            <ThemedText style={styles.transactionAmount}>{formattedAmount}</ThemedText>
            {formattedRunningBalance && (
              <ThemedText style={styles.runningBalance}>
                Balance: {formattedRunningBalance}
              </ThemedText>
            )}
          </View>
          {transaction.notes && (
            <ThemedText style={styles.transactionNotes}>{transaction.notes}</ThemedText>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Transaction Details</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading transactions...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Transaction Details</ThemedText>
        </ThemedView>
        <ThemedView style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>←</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Transaction Details</ThemedText>
        <TouchableOpacity onPress={() => router.push('/journal-list' as any)} style={styles.contextButton}>
          <ThemedText style={styles.contextButtonText}>All Journals</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No transactions found</ThemedText>
          </ThemedView>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  contextButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 16,
  },
  contextButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountType: {
    fontSize: 12,
    opacity: 0.7,
  },
  transactionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  transactionTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionDate: {
    fontSize: 14,
    opacity: 0.8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  runningBalance: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  transactionNotes: {
    fontSize: 14,
    opacity: 0.8,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'red',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
});
