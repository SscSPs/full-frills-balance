import { CurrencyFormatter } from '@/src/utils/currencyFormatter';
import { preferences } from '@/src/utils/preferences';

// Mock preferences to avoid AsyncStorage issues
jest.mock('@/src/utils/preferences', () => ({
    preferences: {
        defaultCurrencyCode: 'USD',
    }
}));

describe('CurrencyFormatter', () => {
    describe('formatAmount', () => {
        it('formats USD correctly with default options', () => {
            const result = CurrencyFormatter.formatAmount(1234.56, 'USD');
            // Use regex or contain because locale might vary slightly (space/no-space)
            expect(result).toMatch(/\$1,234\.56/);
        });

        it('formats EUR correctly', () => {
            const result = CurrencyFormatter.formatAmount(1234.56, 'EUR');
            expect(result).toMatch(/€1,234\.56/);
        });

        it('respects includeSymbol: false', () => {
            const result = CurrencyFormatter.formatAmount(1234.56, 'USD', { includeSymbol: false });
            expect(result).toMatch(/1,234\.56/);
            expect(result).not.toContain('$');
        });

        it('respects fraction digit options', () => {
            const result = CurrencyFormatter.formatAmount(1234.5678, 'USD', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
            expect(result).toMatch(/\$1,235/);
        });

        it('handles fallback for invalid currency', () => {
            // Mock toLocaleString to throw to test fallback
            const originalToLocaleString = Number.prototype.toLocaleString;
            Number.prototype.toLocaleString = jest.fn().mockImplementation(() => { throw new Error('fail') });

            const result = CurrencyFormatter.formatAmount(100, 'INVALID');
            expect(result).toBe('100.00 INVALID');

            Number.prototype.toLocaleString = originalToLocaleString;
        });
    });

    describe('formatWithPreference', () => {
        it('uses preference currency if set', () => {
            preferences.defaultCurrencyCode = 'GBP';
            const result = CurrencyFormatter.formatWithPreference(100);
            expect(result).toContain('£');
        });
    });

    describe('formatShort', () => {
        it('formats thousands as K', () => {
            expect(CurrencyFormatter.formatShort(1500, 'USD')).toBe('1.5K');
            expect(CurrencyFormatter.formatShort(1000, 'USD')).toBe('1K');
        });

        it('formats millions as M', () => {
            expect(CurrencyFormatter.formatShort(2500000, 'USD')).toBe('2.5M');
        });

        it('formats billions as B', () => {
            expect(CurrencyFormatter.formatShort(3000000000, 'USD')).toBe('3B');
        });

        describe('INR special handling', () => {
            it('formats 100K as 1L in INR', () => {
                expect(CurrencyFormatter.formatShort(100000, 'INR')).toBe('1L');
                expect(CurrencyFormatter.formatShort(150000, 'INR')).toBe('1.5L');
            });

            it('formats 10M as 1Cr in INR', () => {
                expect(CurrencyFormatter.formatShort(10000000, 'INR')).toBe('1Cr');
                expect(CurrencyFormatter.formatShort(12000000, 'INR')).toBe('1.2Cr');
            });

            it('still uses K for thousands in INR', () => {
                expect(CurrencyFormatter.formatShort(5000, 'INR')).toBe('5K');
            });
        });

        it('handles negative numbers correctly', () => {
            expect(CurrencyFormatter.formatShort(-1500, 'USD')).toBe('-1.5K');
        });

        it('returns exact amount without decimals if below 1000', () => {
            expect(CurrencyFormatter.formatShort(500, 'USD')).toMatch(/\$500/);
        });
    });
});
