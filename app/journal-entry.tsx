import { AppButton, AppCard, AppText } from '@/components/core';
import { AppConfig, Shape, Spacing, ThemeMode, useThemeColors } from '@/constants';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { CreateJournalData, journalRepository } from '@/src/data/repositories/JournalRepository';
import { JournalCalculator, JournalLineInput } from '@/src/domain/accounting/JournalCalculator';
import { JournalValidator } from '@/src/domain/accounting/JournalValidator';
import { showErrorAlert, showSuccessAlert } from '@/src/utils/alerts';
import { sanitizeAmount } from '@/src/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountSelector } from '../components/journal/AccountSelector';
import { JournalEntryLine, JournalLineItem } from '../components/journal/JournalLineItem';
import { JournalSummary } from '../components/journal/JournalSummary';
import SimpleJournalForm from '../components/journal/SimpleJournalForm';
import { useUser } from '../contexts/UIContext';



export default function JournalEntryScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { themePreference } = useUser()
  const colorScheme = useColorScheme()
  const themeMode: ThemeMode = themePreference === 'system'
    ? (colorScheme === 'dark' ? 'dark' : 'light')
    : themePreference
  const theme = useThemeColors(themeMode)

  // Handle URL parameters
  useEffect(() => {
    if (params.mode === 'simple') {
      setIsGuidedMode(true)
    } else if (params.mode === 'advanced') {
      setIsGuidedMode(false)
    }

    if (params.type === 'income' || params.type === 'expense' || params.type === 'transfer') {
      setTransactionType(params.type as 'income' | 'expense' | 'transfer')
    }
  }, [params.mode, params.type])

  // Guided mode state
  const [isGuidedMode, setIsGuidedMode] = useState(true)

  // Simple mode state (Handled in SimpleJournalForm)
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer'>('expense')

  // Advanced mode state (existing)
  const [description, setDescription] = useState('')
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0])
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { id: '1', accountId: '', accountName: '', accountType: AccountType.ASSET, amount: '', transactionType: TransactionType.DEBIT, notes: '', exchangeRate: '' },
    { id: '2', accountId: '', accountName: '', accountType: AccountType.ASSET, amount: '', transactionType: TransactionType.CREDIT, notes: '', exchangeRate: '' },
  ])
  const [accounts, setAccounts] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const allAccounts = await accountRepository.findAll()
      setAccounts(allAccounts)
    } catch (error) {
      console.error('Failed to load accounts:', error)
      showErrorAlert('Failed to load accounts')
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const addLine = () => {
    const newId = (Math.max(...lines.map(l => parseInt(l.id))) + 1).toString()
    setLines([...lines, {
      id: newId,
      accountId: '',
      accountName: '',
      accountType: AccountType.ASSET,
      amount: '',
      transactionType: TransactionType.DEBIT,
      notes: '',
      exchangeRate: ''
    }])
  }

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(line => line.id !== id))
    }
  }

  const updateLine = (id: string, field: keyof JournalEntryLine, value: any) => {
    setLines(lines.map(line =>
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const selectAccount = (accountId: string) => {
    if (!selectedLineId) return

    const account = accounts.find(acc => acc.id === accountId)
    if (account) {
      // Update all fields at once to avoid state conflicts
      const updatedLine = {
        accountId: accountId,
        accountName: account.name,
        accountType: account.accountType,
        accountCurrency: account.currencyCode
      }

      setLines(lines.map(line =>
        line.id === selectedLineId ? { ...line, ...updatedLine } : line
      ))
    }
    setShowAccountPicker(false)
    setSelectedLineId(null)
  }

  const getLineBaseAmount = (line: JournalEntryLine): number => {
    const amount = sanitizeAmount(line.amount) || 0;
    const rate = line.exchangeRate && parseFloat(line.exchangeRate) ? parseFloat(line.exchangeRate) : 1;

    // If account currency matches journal currency or no rate provided, use amount as is
    if (!line.accountCurrency || line.accountCurrency === AppConfig.defaultCurrency) {
      return amount;
    }

    // Convert to base currency (USD) for balancing
    const baseAmount = amount / rate;
    return Math.round(baseAmount * 100) / 100;
  }

  // Transform UI lines to Domain lines for calculation
  const getDomainLines = (): JournalLineInput[] => {
    return lines.map(line => ({
      amount: getLineBaseAmount(line),
      type: line.transactionType
    }));
  }

  const getTotalDebits = () => JournalCalculator.calculateTotalDebits(getDomainLines());

  const getTotalCredits = () => JournalCalculator.calculateTotalCredits(getDomainLines());

  const validationResult = JournalValidator.validate(getDomainLines());
  const isBalanced = JournalCalculator.isBalanced(getDomainLines());

  const validateJournal = () => {
    if (!description.trim()) {
      return { valid: false, error: 'Description is required' }
    }

    if (lines.some(line => !line.accountId)) {
      return { valid: false, error: 'All lines must have an account selected' }
    }

    if (!validationResult.isValid) {
      // Prioritize balance errors, then others
      const balanceError = validationResult.errors.find(e => e.includes('balanced'));
      return { valid: false, error: balanceError || validationResult.errors[0] };
    }

    return { valid: true, error: null }
  }


  const createJournal = async () => {
    const validation = validateJournal()
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.error || 'Validation failed')
      return
    }

    setIsCreating(true)

    try {
      const journalData: CreateJournalData = {
        journalDate: new Date(journalDate).getTime(),
        description: description.trim() || undefined,
        currencyCode: AppConfig.defaultCurrency,
        transactions: lines.map(line => ({
          accountId: line.accountId,
          amount: sanitizeAmount(line.amount) || 0,
          transactionType: line.transactionType,
          notes: line.notes.trim() || undefined,
          exchangeRate: line.exchangeRate && line.exchangeRate.trim()
            ? parseFloat(line.exchangeRate)
            : undefined,
        }))
      }

      await journalRepository.createJournalWithTransactions(journalData)
      showSuccessAlert('Success', 'Journal entry created successfully')
      router.push('/(tabs)' as any)
    } catch (error) {
      console.error('Failed to create journal:', error)
      showErrorAlert('Failed to create journal entry')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoadingAccounts) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <AppText variant="body" themeMode={themeMode}>Loading accounts...</AppText>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <AppText variant="heading" themeMode={themeMode} style={styles.headerTitle}>
          {isGuidedMode ? 'New Transaction' : 'Journal Entry'}
        </AppText>
        <TouchableOpacity onPress={() => router.push('/(tabs)' as any)} style={styles.listButton}>
          <Ionicons name="list" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        <AppCard elevation="sm" padding="lg" style={styles.modeToggleCard} themeMode={themeMode}>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                isGuidedMode && styles.modeButtonActive,
                { backgroundColor: isGuidedMode ? theme.primary : theme.surface }
              ]}
              onPress={() => setIsGuidedMode(true)}
            >
              <AppText
                variant="body"
                themeMode={themeMode}
                style={{ color: isGuidedMode ? '#fff' : theme.text }}
              >
                Simple
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                !isGuidedMode && styles.modeButtonActive,
                { backgroundColor: !isGuidedMode ? theme.primary : theme.surface }
              ]}
              onPress={() => setIsGuidedMode(false)}
            >
              <AppText
                variant="body"
                themeMode={themeMode}
                style={{ color: !isGuidedMode ? '#fff' : theme.text }}
              >
                Advanced
              </AppText>
            </TouchableOpacity>
          </View>
        </AppCard>

        {isGuidedMode ? (
          <SimpleJournalForm
            accounts={accounts}
            themeMode={themeMode}
            onSuccess={() => {
              router.push('/(tabs)')
            }}
            initialType={transactionType}
          />
        ) : (
          // Advanced Mode UI (existing)
          <View>
            <AppCard elevation="sm" padding="lg" style={styles.titleCard} themeMode={themeMode}>
              <AppText variant="title" themeMode={themeMode}>Create Journal Entry</AppText>
            </AppCard>

            <AppCard elevation="sm" padding="lg" style={styles.inputCard} themeMode={themeMode}>
              <AppText variant="body" themeMode={themeMode} style={styles.label}>Date</AppText>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }]}
                value={journalDate}
                onChangeText={setJournalDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />

              <AppText variant="body" themeMode={themeMode} style={styles.label}>Description</AppText>
              <TextInput
                style={[styles.input, styles.textArea, {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  color: theme.text
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor={theme.textSecondary}
                multiline
              />
            </AppCard>

            <AppCard elevation="sm" padding="lg" style={styles.linesCard} themeMode={themeMode}>
              <View style={styles.linesHeader}>
                <AppText variant="heading" themeMode={themeMode}>Journal Lines</AppText>
                <TouchableOpacity onPress={addLine} style={styles.addButton}>
                  <AppText variant="body" color="primary" themeMode={themeMode}>+ Add Line</AppText>
                </TouchableOpacity>
              </View>

              {lines.map((line, index) => (
                <JournalLineItem
                  key={line.id}
                  line={line}
                  index={index}
                  themeMode={themeMode}
                  canRemove={lines.length > 2}
                  onUpdate={(field, value) => updateLine(line.id, field, value)}
                  onRemove={() => removeLine(line.id)}
                  onSelectAccount={() => {
                    setSelectedLineId(line.id)
                    setShowAccountPicker(true)
                  }}
                  getLineBaseAmount={getLineBaseAmount}
                />
              ))}
            </AppCard>

            <JournalSummary
              totalDebits={getTotalDebits()}
              totalCredits={getTotalCredits()}
              isBalanced={isBalanced}
              themeMode={themeMode}
            />

            <View style={styles.actions}>
              <AppButton
                variant="primary"
                onPress={createJournal}
                disabled={!isBalanced || isCreating}
                themeMode={themeMode}
                style={styles.createButton}
              >
                {isCreating ? 'Creating...' : 'Create Journal'}
              </AppButton>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Account Picker Modal */}
      <AccountSelector
        visible={showAccountPicker}
        accounts={accounts}
        themeMode={themeMode}
        onClose={() => setShowAccountPicker(false)}
        onSelect={selectAccount}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  listButton: {
    padding: Spacing.sm,
  },
  listButtonText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  modeToggleCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: Shape.radius.full,
    padding: Spacing.xs,
  },
  modeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Shape.radius.full,
    alignItems: 'center',
  },
  modeButtonActive: {
    // Shadow for active state
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  transactionTypeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Shape.radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  transactionTypeButtonSelected: {
    borderWidth: 2,
  },
  accountSelector: {
    gap: Spacing.sm,
  },
  accountOption: {
    padding: Spacing.md,
    borderRadius: Shape.radius.r3,
    borderWidth: 1,
  },
  accountOptionSelected: {
    borderWidth: 2,
  },
  titleCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inputCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  linesCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: Shape.radius.r3,
    padding: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  linesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addButton: {
    padding: Spacing.sm,
  },
  lineContainer: {
    borderWidth: 1,
    borderRadius: Shape.radius.r2,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  accountItem: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: Shape.radius.r3,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Shape.radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  typeButtonActive: {
    // Handled by inline styles for theme colors
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  balanceText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: {
    padding: Spacing.lg,
  },
  createButton: {
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Shape.radius.r1,
    borderTopRightRadius: Shape.radius.r1,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  accountsList: {
    flex: 1,
  },
})
