import { AppButton, AppCard, AppText } from '@/components/core'
import { Shape, Spacing, useThemeColors } from '@/constants'
import Currency from '@/src/data/models/Currency'
import { currencyInitService } from '@/src/services/currency-init-service'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useUI } from '../contexts/UIContext'

export default function OnboardingScreen() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const { themePreference, themeMode } = useUI()
  const theme = useThemeColors(themeMode)
  const { completeOnboarding } = useUI()

  useEffect(() => {
    const loadCurrencies = async () => {
      // Ensure currencies are initialized
      await currencyInitService.initialize()
      const all = await currencyInitService.getAllCurrencies()
      setCurrencies(all)
    }
    loadCurrencies()
  }, [])

  const handleContinue = async () => {
    if (step === 1) {
      if (!name.trim()) return
      setStep(2)
      return
    }

    setIsCompleting(true)
    try {
      await completeOnboarding(name.trim(), selectedCurrency)
      router.push('/account-creation' as any)
    } catch (error) {
      console.error('Failed to complete onboarding:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const renderNameStep = () => (
    <>
      <AppText variant="title" themeMode={themeMode} style={styles.title}>
        Welcome to Balance
      </AppText>
      <AppText variant="body" color="secondary" themeMode={themeMode} style={styles.subtitle}>
        Let's start with your name to personalize your experience.
      </AppText>

      <AppCard elevation="sm" padding="lg" style={styles.inputContainer} themeMode={themeMode}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: theme.border,
              color: theme.text,
              backgroundColor: theme.surface
            }
          ]}
          placeholder="Enter your name"
          placeholderTextColor={theme.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </AppCard>

      <AppButton
        variant="primary"
        size="lg"
        onPress={handleContinue}
        disabled={!name.trim() || isCompleting}
        themeMode={themeMode}
        style={styles.continueButton}
      >
        Continue
      </AppButton>
    </>
  )

  const renderCurrencyStep = () => (
    <>
      <AppText variant="title" themeMode={themeMode} style={styles.title}>
        Default Currency
      </AppText>
      <AppText variant="body" color="secondary" themeMode={themeMode} style={styles.subtitle}>
        Choose the default currency for your accounts and transactions. You can change this later for individual accounts.
      </AppText>

      <AppCard elevation="sm" padding="none" style={styles.currencyListContainer} themeMode={themeMode}>
        <FlatList
          data={currencies}
          keyExtractor={(item) => item.code}
          style={styles.currencyList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.currencyItem,
                { borderBottomColor: theme.border },
                selectedCurrency === item.code && { backgroundColor: theme.primary + '11' }
              ]}
              onPress={() => setSelectedCurrency(item.code)}
            >
              <View style={styles.currencyInfo}>
                <AppText variant="body" themeMode={themeMode}>{item.name}</AppText>
                <AppText variant="caption" color="secondary" themeMode={themeMode}>{item.code}</AppText>
              </View>
              <View style={styles.currencyRight}>
                <AppText variant="subheading" themeMode={themeMode}>{item.symbol}</AppText>
                {selectedCurrency === item.code && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={{ marginLeft: 8 }} />
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      </AppCard>

      <View style={styles.buttonContainer}>
        <AppButton
          variant="primary"
          size="lg"
          onPress={handleContinue}
          disabled={isCompleting}
          themeMode={themeMode}
          style={styles.continueButton}
        >
          {isCompleting ? 'Setting up...' : 'Get Started'}
        </AppButton>
        <AppButton
          variant="outline"
          size="lg"
          onPress={() => setStep(1)}
          disabled={isCompleting}
          themeMode={themeMode}
        >
          Back
        </AppButton>
      </View>
    </>
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {step === 1 ? renderNameStep() : renderCurrencyStep()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: Shape.radius.r3,
    padding: Spacing.md,
    fontSize: 16,
  },
  currencyListContainer: {
    height: 300,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  currencyList: {
    flex: 1,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: Spacing.md,
  },
  continueButton: {
    marginBottom: Spacing.xs,
  },
});
