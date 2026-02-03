import Currency from '@/src/data/models/Currency';
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository';
import { useObservable } from '@/src/hooks/useObservable';
import { currencyInitService } from '@/src/services/currency-init-service';
import { logger } from '@/src/utils/logger';
import { useEffect } from 'react';

/**
 * Hook to reactively get all available currencies
 */
export function useCurrencies() {
    const { data: currencies, isLoading } = useObservable(
        () => currencyRepository.observeAll(),
        [],
        [] as Currency[]
    );

    useEffect(() => {
        currencyInitService.initialize().catch((error) => {
            logger.warn('[useCurrencies] Failed to initialize currencies', { error });
        });
    }, []);

    return { currencies, isLoading };
}
