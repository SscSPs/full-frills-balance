import { database } from '@/src/data/database/Database'
import Currency from '@/src/data/models/Currency'
import { Q } from '@nozbe/watermelondb'

export class CurrencyRepository {
    private get currencies() {
        return database.collections.get<Currency>('currencies')
    }

    /**
     * Finds a currency by its code
     */
    async findByCode(code: string): Promise<Currency | null> {
        const currencies = await this.currencies
            .query(Q.where('code', code))
            .fetch()
        return currencies[0] || null
    }

    /**
     * Gets the precision for a currency code.
     * Falls back to 2 if currency not found or default.
     */
    async getPrecision(code: string): Promise<number> {
        const currency = await this.findByCode(code)
        if (currency) return currency.precision

        // Fallback logic
        if (code === 'JPY' || code === 'KRW') return 0
        if (code === 'KWD' || code === 'BHD') return 3

        return 2 // Default decimal places
    }

    /**
     * Gets all available currencies
     */
    async findAll(): Promise<Currency[]> {
        return this.currencies.query().fetch()
    }
}

export const currencyRepository = new CurrencyRepository()
