import { AppConfig } from '@/src/constants';
import { preferences } from '@/src/utils/preferences';

/**
 * Formatting options for CurrencyFormatter
 */
export interface CurrencyFormatOptions {
    includeSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}

/**
 * CurrencyFormatter - Centralized utility for formatting currency amounts.
 */
export const CurrencyFormatter = {
    /**
     * Formats an amount with a specific currency code.
     */
    formatAmount(
        amount: number,
        currencyCode: string,
        options: CurrencyFormatOptions = {}
    ): string {
        const {
            includeSymbol = true,
            minimumFractionDigits = 2,
            maximumFractionDigits = 2
        } = options;

        try {
            return amount.toLocaleString(undefined, {
                style: includeSymbol ? 'currency' : 'decimal',
                currency: currencyCode,
                minimumFractionDigits,
                maximumFractionDigits,
            });
        } catch {
            // Fallback if currency code is invalid or not supported
            return `${amount.toFixed(maximumFractionDigits)} ${currencyCode}`;
        }
    },

    /**
     * Formats an amount using the user's default currency preference.
     */
    formatWithPreference(amount: number, options?: CurrencyFormatOptions): string {
        const defaultCurrency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        return this.formatAmount(amount, defaultCurrency, options);
    },

    /**
     * Formats an amount with a fallback to the user's preference if currencyCode is missing.
     */
    format(amount: number, currencyCode?: string, options?: CurrencyFormatOptions): string {
        const code = currencyCode || preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        return this.formatAmount(amount, code, options);
    },

    /**
     * Formats an amount in short form (e.g., 1K, 1M, 1L, 1Cr).
     */
    formatShort(amount: number, currencyCode?: string): string {
        const code = currencyCode || preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        const absAmount = Math.abs(amount);
        const sign = amount < 0 ? '-' : '';

        if (code === 'INR') {
            if (absAmount >= 10000000) { // 1 Crore
                return `${sign}${(absAmount / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
            }
            if (absAmount >= 100000) { // 1 Lakh
                return `${sign}${(absAmount / 100000).toFixed(1).replace(/\.0$/, '')}L`;
            }
            if (absAmount >= 1000) {
                return `${sign}${(absAmount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            }
        } else {
            if (absAmount >= 1000000000000) {
                return `${sign}${(absAmount / 1000000000000).toFixed(1).replace(/\.0$/, '')}T`;
            }
            if (absAmount >= 1000000000) {
                return `${sign}${(absAmount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
            }
            if (absAmount >= 1000000) {
                return `${sign}${(absAmount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
            }
            if (absAmount >= 1000) {
                return `${sign}${(absAmount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
            }
        }

        return this.format(amount, code, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
};
