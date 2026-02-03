/**
 * Exchange Rate Service
 * 
 * Handles currency conversion with caching and API integration.
 * Uses exchangerate-api.com free tier (1500 requests/month).
 * 
 * All database operations are delegated to ExchangeRateRepository.
 */

import { AppConfig } from '@/src/constants'
import { exchangeRateRepository } from '@/src/data/repositories/ExchangeRateRepository'
import { logger } from '@/src/utils/logger'

export interface ExchangeRateData {
    fromCurrency: string
    toCurrency: string
    rate: number
    effectiveDate: number
    source: string
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export class ExchangeRateService {
    private memoryCache: Map<string, { rates: Record<string, number>; timestamp: number }> = new Map()

    /**
     * Get exchange rate, using cache if available and recent
     */
    async getRate(fromCurrency: string, toCurrency: string): Promise<number> {
        // Same currency = rate of 1
        if (fromCurrency === toCurrency) {
            return 1.0
        }

        // 1. Check Memory Cache
        const memCached = this.memoryCache.get(fromCurrency)
        if (memCached && Date.now() - memCached.timestamp < CACHE_DURATION_MS) {
            if (memCached.rates[toCurrency]) {
                return memCached.rates[toCurrency]
            }
        }

        // 2. Check DB Cache via repository
        const cached = await exchangeRateRepository.getCachedRate(fromCurrency, toCurrency)
        if (cached && this.isRateFresh(cached.effectiveDate)) {
            // Update memory cache for this base while we're at it
            this.updateMemoryCache(fromCurrency, toCurrency, cached.rate)
            return cached.rate
        }

        // 3. Fetch fresh rates for the entire base
        const rates = await this.fetchRatesForBase(fromCurrency)

        if (!rates[toCurrency]) {
            throw new Error(`No rate found for ${fromCurrency} to ${toCurrency}`)
        }

        // 4. Persist this specific rate to DB for offline use via repository
        await exchangeRateRepository.cacheRate({
            fromCurrency,
            toCurrency,
            rate: rates[toCurrency],
        })

        return rates[toCurrency]
    }

    private updateMemoryCache(base: string, target: string, rate: number) {
        const entry = this.memoryCache.get(base) || { rates: {}, timestamp: Date.now() }
        entry.rates[target] = rate
        this.memoryCache.set(base, entry)
    }

    /**
     * Check if cached rate is still fresh  
     */
    private isRateFresh(effectiveDate: number): boolean {
        const age = Date.now() - effectiveDate
        return age < CACHE_DURATION_MS
    }

    /**
     * Fetch all rates for a base currency and cache them
     */
    async fetchRatesForBase(fromCurrency: string): Promise<Record<string, number>> {
        try {
            const response = await fetch(`${AppConfig.api.exchangeRateBaseUrl}/${fromCurrency}`)

            if (!response.ok) {
                throw new Error(`Exchange rate API error: ${response.statusText}`)
            }

            const data = await response.json()
            const rates = data.rates as Record<string, number>

            if (!rates) {
                throw new Error(`No rates found for base ${fromCurrency}`)
            }

            // Update memory cache
            this.memoryCache.set(fromCurrency, {
                rates,
                timestamp: Date.now()
            })

            return rates
        } catch (error) {
            logger.error('Failed to fetch exchange rates:', error)

            // Fallback: try to get any cached rate from DB if API fails
            const cachedRecords = await exchangeRateRepository.getAllRatesForBase(fromCurrency)

            if (cachedRecords.length > 0) {
                logger.warn(`Using stale exchange rates from DB for ${fromCurrency}`)
                const staleRates: Record<string, number> = {}
                cachedRecords.forEach(r => {
                    staleRates[r.toCurrency] = r.rate
                })
                return staleRates
            }

            throw error
        }
    }

    /**
     * Convert amount between currencies
     */
    async convert(
        amount: number,
        fromCurrency: string,
        toCurrency: string
    ): Promise<{ convertedAmount: number; rate: number }> {
        const rate = await this.getRate(fromCurrency, toCurrency)
        const convertedAmount = amount * rate

        return {
            convertedAmount,
            rate,
        }
    }
}

// Export singleton instance
export const exchangeRateService = new ExchangeRateService()
