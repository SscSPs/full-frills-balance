/**
 * Currency Converter Widget
 * 
 * Shows exchange rate and converted amount for cross-currency transfers
 */

import { AppText } from '@/components/core'
import { Spacing } from '@/constants'
import { exchangeRateService } from '@/src/services/exchange-rate-service'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

interface CurrencyConverterWidgetProps {
    amount: number
    fromCurrency: string
    toCurrency: string
    themeMode: 'light' | 'dark'
    onRateLoaded?: (rate: number, convertedAmount: number) => void
}

export function CurrencyConverterWidget({
    amount,
    fromCurrency,
    toCurrency,
    themeMode,
    onRateLoaded,
}: CurrencyConverterWidgetProps) {
    const [rate, setRate] = useState<number | null>(null)
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!amount || amount <= 0 || fromCurrency === toCurrency) {
            setRate(null)
            setConvertedAmount(null)
            return
        }

        const fetchRate = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const result = await exchangeRateService.convert(
                    amount,
                    fromCurrency,
                    toCurrency
                )

                setRate(result.rate)
                setConvertedAmount(result.convertedAmount)

                if (onRateLoaded) {
                    onRateLoaded(result.rate, result.convertedAmount)
                }
            } catch (err) {
                setError('Failed to fetch exchange rate')
                console.error('Exchange rate error:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchRate()
    }, [amount, fromCurrency, toCurrency, onRateLoaded])

    if (fromCurrency === toCurrency) {
        return null
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" />
                <AppText variant="caption" color="secondary" themeMode={themeMode}>
                    Fetching exchange rate...
                </AppText>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.container}>
                <AppText variant="caption" color="error" themeMode={themeMode}>
                    {error}
                </AppText>
            </View>
        )
    }

    if (!rate || !convertedAmount) {
        return null
    }

    return (
        <View style={styles.container}>
            <View style={styles.conversionRow}>
                <AppText variant="body" themeMode={themeMode}>
                    {amount.toFixed(2)} {fromCurrency}
                </AppText>
                <AppText variant="body" color="secondary" themeMode={themeMode}>
                    →
                </AppText>
                <AppText variant="body" color="success" themeMode={themeMode}>
                    {convertedAmount.toFixed(2)} {toCurrency}
                </AppText>
            </View>
            <AppText variant="caption" color="secondary" themeMode={themeMode}>
                Rate: 1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
            </AppText>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        gap: Spacing.xs,
    },
    conversionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
})
