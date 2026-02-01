import { amountsAreEqual, getEpsilon, roundToPrecision, safeAdd, safeSubtract } from '@/src/utils/money';

describe('money utility', () => {
    describe('roundToPrecision', () => {
        it('rounds to 2 decimal places correctly', () => {
            expect(roundToPrecision(1.234, 2)).toBe(1.23);
            expect(roundToPrecision(1.235, 2)).toBe(1.24);
            expect(roundToPrecision(1.236, 2)).toBe(1.24);
        });

        it('handles mid-point rounding with Number.EPSILON', () => {
            // 1.005 can be problematic in floating point
            expect(roundToPrecision(1.005, 2)).toBe(1.01);
        });

        it('handles 0 precision', () => {
            expect(roundToPrecision(1.5, 0)).toBe(2);
            expect(roundToPrecision(1.4, 0)).toBe(1);
        });
    });

    describe('getEpsilon', () => {
        it('returns 0.001 for precision 2', () => {
            expect(getEpsilon(2)).toBeCloseTo(0.001);
        });
        it('returns 0.01 for precision 1', () => {
            expect(getEpsilon(1)).toBeCloseTo(0.01);
        });
    });

    describe('amountsAreEqual', () => {
        it('identifies equal amounts after rounding', () => {
            expect(amountsAreEqual(1.2300000000001, 1.23, 2)).toBe(true);
            expect(amountsAreEqual(1.234, 1.23, 2)).toBe(true);
        });

        it('identifies unequal amounts', () => {
            expect(amountsAreEqual(1.23, 1.24, 2)).toBe(false);
        });
    });

    describe('safeAdd', () => {
        it('adds and rounds correctly', () => {
            expect(safeAdd(1.234, 1.234, 2)).toBe(2.47); // 1.234 + 1.234 = 2.468 -> 2.47
        });
    });

    describe('safeSubtract', () => {
        it('subtracts and rounds correctly', () => {
            expect(safeSubtract(2.468, 1.234, 2)).toBe(1.23); // 2.468 - 1.234 = 1.234 -> 1.23
        });
    });
});
