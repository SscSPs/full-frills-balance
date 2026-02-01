/**
 * Exchange Rate Service
 * 
 * Handles currency conversion with caching and API integration.
 * Uses exchangerate-api.com free tier (1500 requests/month).
 */

import { AppConfig } from '@/src/constants'
import { database } from '@/src/data/database/Database'
import ExchangeRate from '@/src/data/models/ExchangeRate'
import { logger } from '@/src/utils/logger'
import { Q } from '@nozbe/watermelondb'

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

    private get exchangeRates() {
        return database.collections.get<ExchangeRate>('exchange_rates')
    }

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

        // 2. Check DB Cache
        const cached = await this.getCachedRate(fromCurrency, toCurrency)
        if (cached && this.isRateFresh(cached)) {
            // Update memory cache for this base while we're at it
            this.updateMemoryCache(fromCurrency, toCurrency, cached.rate)
            return cached.rate
        }

        // 3. Fetch fresh rates for the entire base
        const rates = await this.fetchRatesForBase(fromCurrency)

        if (!rates[toCurrency]) {
            throw new Error(`No rate found for ${fromCurrency} to ${toCurrency}`)
        }

        // 4. Persist this specific rate to DB for offline use
        await this.cacheRate(fromCurrency, toCurrency, rates[toCurrency])

        return rates[toCurrency]
    }

    private updateMemoryCache(base: string, target: string, rate: number) {
        const entry = this.memoryCache.get(base) || { rates: {}, timestamp: Date.now() }
        entry.rates[target] = rate
        this.memoryCache.set(base, entry)
    }

    /**
     * Get cached rate from database
     */
    private async getCachedRate(
        fromCurrency: string,
        toCurrency: string
    ): Promise<ExchangeRate | null> {
        const rates = await this.exchangeRates
            .query(
                Q.where('from_currency', fromCurrency),
                Q.where('to_currency', toCurrency),
                Q.sortBy('effective_date', Q.desc),
                Q.take(1)
            )
            .fetch()

        return rates[0] || null
    }

    /**
     * Check if cached rate is still fresh  
     */
    private isRateFresh(rate: ExchangeRate): boolean {
        const age = Date.now() - rate.effectiveDate
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
            const cachedRecords = await this.exchangeRates
                .query(Q.where('from_currency', fromCurrency))
                .fetch()

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
     * Cache exchange rate in database
     */
    private async cacheRate(
        fromCurrency: string,
        toCurrency: string,
        rate: number
    ): Promise<void> {
        await database.write(async () => {
            await this.exchangeRates.create((record) => {
                record.fromCurrency = fromCurrency
                record.toCurrency = toCurrency
                record.rate = rate
                record.effectiveDate = Date.now()
                record.source = 'exchangerate-api.com'
            })
        })
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
