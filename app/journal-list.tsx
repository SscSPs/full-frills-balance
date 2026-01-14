import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { database } from '@/src/data/database/Database';
import { TransactionType } from '@/src/data/models/Transaction';
import { journalRepository } from '@/src/data/repositories/JournalRepository';
import { showErrorAlert } from '@/src/utils/alerts';
import { Q } from '@nozbe/watermelondb';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface JournalWithAmount {
  id: string;
  journalDate: number;
  description?: string;
  currencyCode: string;
  status: string;
  createdAt: Date;
  totalAmount: string;
  transactionCount?: number;
}

export default function JournalListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e9ecef', dark: '#333' }, 'background');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1a1a1a' }, 'background');
  
  const [journals, setJournals] = useState<JournalWithAmount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadJournals = async () => {
      try {
        console.log('Loading journals...');
        const userJournals = await journalRepository.findAll();
        console.log('Found journals:', userJournals.length, userJournals);
        
        // Convert to JournalWithAmount format with default values
        const journalsWithAmounts = userJournals.map((journal: any) => ({
          id: journal.id,
          journalDate: journal.journalDate,
          description: journal.description,
          currencyCode: journal.currencyCode,
          status: journal.status,
          createdAt: journal.createdAt,
          totalAmount: '0.00',
          transactionCount: 0,
        }));
        
        console.log('Setting journals:', journalsWithAmounts.length);
        setJournals(journalsWithAmounts);
      } catch (error) {
        console.error('Error loading journals:', error);
        showErrorAlert(error, 'Failed to Load Journals');
        setJournals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadJournals();
  }, []);

  // Load transactions for each journal to calculate amounts
  useEffect(() => {
    const loadTransactionsForJournals = async () => {
      if (journals.length === 0) return;

      console.log('Loading transactions for journals...');
      
      const journalWithAmountsPromises = journals.map(async (journal) => {
        try {
          console.log(`Loading transactions for journal ${journal.id}...`);
          
          // Try different approaches to fetch transactions
          let transactions: any[] | null = null;
          
          try {
            // Method 1: Query transactions by journalId
            transactions = await database.collections.get('transactions')
              .query(Q.where('journal_id', journal.id))
              .fetch();
            console.log(`Method 1 - Query by journalId: ${transactions?.length || 0} transactions`);
          } catch (error) {
            console.log('Method 1 failed:', error);
          }
          
          const validTransactions = transactions || [];
          console.log(`Final transaction count for journal ${journal.id}: ${validTransactions.length}`);
          
          // Calculate total amount (sum of debit transactions only to avoid double counting)
          const totalAmount = validTransactions.reduce((sum: number, tx: any) => {
            // Only sum debit transactions to get the actual amount moved
            if (tx.transactionType === TransactionType.DEBIT) {
              const amount = parseFloat(tx.amount) || 0;
              return sum + amount;
            }
            return sum;
          }, 0);
          
          console.log(`Calculated amount for journal ${journal.id}: ${totalAmount}`);
          
          return {
            ...journal,
            totalAmount: totalAmount.toFixed(2),
            transactionCount: validTransactions.length,
          };
        } catch (error) {
          console.error(`Error loading transactions for journal ${journal.id}:`, error);
          return {
            ...journal,
            totalAmount: '0.00',
            transactionCount: 0,
          };
        }
      });

      const journalWithAmounts = await Promise.all(journalWithAmountsPromises);
      console.log('Final journals with amounts:', journalWithAmounts);
      setJournals(journalWithAmounts);
    };

    loadTransactionsForJournals();
  }, [journals.length > 0 ? journals.map(j => j.id).join(',') : null]);

  const handleCreateJournal = () => {
    router.push('/journal-entry' as any)
  }

  const handleJournalPress = (journal: JournalWithAmount) => {
    const formattedDate = new Date(journal.journalDate).toLocaleDateString();
    const message = `Description: ${journal.description || 'No description'}\nCurrency: ${journal.currencyCode}\nDate: ${formattedDate}\nStatus: ${journal.status}\nTransactions: ${journal.transactionCount || 0}`;
    
    alert(`Journal Entry\n\n${message}`);
  }

  const renderJournal = ({ item: journal }: { item: JournalWithAmount }) => {
    const formattedDate = new Date(journal.journalDate).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={[styles.journalCard, { backgroundColor: cardBackground, borderColor }]}
        onPress={() => handleJournalPress(journal)}
      >
        <View style={styles.journalHeader}>
          <ThemedText style={styles.journalDate}>{formattedDate}</ThemedText>
          <ThemedText style={styles.journalStatus}>{journal.status}</ThemedText>
        </View>
        
        <ThemedText style={styles.journalDescription}>
          {journal.description || 'No description'}
        </ThemedText>
        
        <View style={styles.journalFooter}>
          <ThemedText style={styles.journalAmount}>
            {journal.totalAmount} {journal.currencyCode}
          </ThemedText>
          <ThemedText style={styles.transactionCount}>
            {journal.transactionCount || 0} transactions
          </ThemedText>
        </View>
      </TouchableOpacity>
    );
  }

  console.log('Rendering JournalListScreen, journals:', journals.length, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Journal Entries</ThemedText>
        </ThemedView>
        <ThemedView style={styles.loadingContainer}>
          <ThemedText>Loading journals...</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <ThemedView style={styles.header}>
          <ThemedText style={styles.title}>Journal Entries</ThemedText>
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
        <ThemedText style={styles.title}>Journal Entries</ThemedText>
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: cardBackground, borderColor }]}
          onPress={handleCreateJournal}
        >
          <ThemedText style={styles.createButtonText}>+ New Journal</ThemedText>
        </TouchableOpacity>
      </ThemedView>
      
      <FlatList
        data={journals}
        renderItem={renderJournal}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>No journal entries found</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Create your first journal entry to get started
            </ThemedText>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  journalCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  journalStatus: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  journalDescription: {
    fontSize: 14,
    marginBottom: 12,
    opacity: 0.8,
  },
  journalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionCount: {
    fontSize: 12,
    opacity: 0.6,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
});