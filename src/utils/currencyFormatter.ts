import { AppConfig } from '@/constants';
import { preferences } from './preferences';

/**
 * CurrencyFormatter - Centralized utility for formatting currency amounts.
 */
export const CurrencyFormatter = {
    /**
     * Formats an amount with a specific currency code.
     */
    formatAmount(amount: number, currencyCode: string, includeSymbol: boolean = true): string {
        try {
            return amount.toLocaleString(undefined, {
                style: includeSymbol ? 'currency' : 'decimal',
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        } catch (error) {
            // Fallback if currency code is invalid or not supported
            return `${amount.toFixed(2)} ${currencyCode}`;
        }
    },

    /**
     * Formats an amount using the user's default currency preference.
     */
    formatWithPreference(amount: number): string {
        const defaultCurrency = preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        return this.formatAmount(amount, defaultCurrency);
    },

    /**
     * Formats an amount with a fallback to the user's preference if currencyCode is missing.
     */
    format(amount: number, currencyCode?: string): string {
        const code = currencyCode || preferences.defaultCurrencyCode || AppConfig.defaultCurrency;
        return this.formatAmount(amount, code);
    }
};
