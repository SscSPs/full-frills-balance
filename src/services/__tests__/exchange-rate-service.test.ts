import { database } from '@/src/data/database/Database';
import { ExchangeRateService } from '@/src/services/exchange-rate-service';

// Mock WatermelonDB database
jest.mock('@/src/data/database/Database', () => ({
    database: {
        collections: {
            get: jest.fn().mockReturnThis(),
            query: jest.fn().mockReturnThis(),
            fetch: jest.fn().mockResolvedValue([]),
        },
        write: jest.fn().mockImplementation(cb => cb()),
    }
}));

// Mock logger
jest.mock('@/src/utils/logger', () => ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
    }
}));

describe('ExchangeRateService', () => {
    let service: ExchangeRateService;
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ExchangeRateService();
        // Reset memory cache by re-instantiating or exposing it if possible.
        // Since it's private, we rely on a fresh instance.
    });

    describe('getRate', () => {
        it('returns 1.0 for same currency', async () => {
            const rate = await service.getRate('USD', 'USD');
            expect(rate).toBe(1.0);
        });

        it('fetches from API if not in cache', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rates: { 'EUR': 0.85 }
                })
            });

            // Mock database create
            const mockCreate = jest.fn();
            (database.collections.get as jest.Mock).mockReturnValue({
                query: jest.fn().mockReturnThis(),
                fetch: jest.fn().mockResolvedValue([]),
                create: mockCreate,
            });

            const rate = await service.getRate('USD', 'EUR');
            expect(rate).toBe(0.85);
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('USD'));
            // Verify it was cached in DB
            expect(mockCreate).toHaveBeenCalled();
        });

        it('uses DB cache if recent', async () => {
            const recentDate = Date.now() - 1000;
            (database.collections.get as jest.Mock).mockReturnValue({
                query: jest.fn().mockReturnThis(),
                fetch: jest.fn().mockResolvedValue([{
                    rate: 0.9,
                    effectiveDate: recentDate,
                    fromCurrency: 'USD',
                    toCurrency: 'EUR'
                }]),
            });

            const rate = await service.getRate('USD', 'EUR');
            expect(rate).toBe(0.9);
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe('convert', () => {
        it('converts amount correctly', async () => {
            // Mock getRate implicitly by mocking the API/DB chain
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    rates: { 'EUR': 0.85 }
                })
            });

            (database.collections.get as jest.Mock).mockReturnValue({
                query: jest.fn().mockReturnThis(),
                fetch: jest.fn().mockResolvedValue([]),
                create: jest.fn(),
            });

            const result = await service.convert(100, 'USD', 'EUR');
            expect(result.convertedAmount).toBe(85);
            expect(result.rate).toBe(0.85);
        });
    });

    describe('fetchRatesForBase fallback', () => {
        it('uses stale DB records if API fails', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            (database.collections.get as jest.Mock).mockReturnValue({
                query: jest.fn().mockReturnThis(),
                fetch: jest.fn().mockResolvedValue([
                    { toCurrency: 'EUR', rate: 0.88 },
                    { toCurrency: 'GBP', rate: 0.75 }
                ]),
            });

            const rates = await service.fetchRatesForBase('USD');
            expect(rates['EUR']).toBe(0.88);
            expect(rates['GBP']).toBe(0.75);
        });
    });
});
