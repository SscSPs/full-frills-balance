import Account from '@/src/data/models/Account';
import { accountRepository } from '@/src/data/repositories/AccountRepository';
import { currencyRepository } from '@/src/data/repositories/CurrencyRepository';
import { transactionRepository } from '@/src/data/repositories/TransactionRepository';
import { useObservable } from '@/src/hooks/useObservable';
import { balanceService } from '@/src/services/BalanceService';
import { AccountBalance } from '@/src/types/domain';
import { logger } from '@/src/utils/logger';
import { combineLatest, debounceTime, switchMap } from 'rxjs';

interface AccountBalancesData {
    accounts: Account[];
    balancesByAccountId: Map<string, AccountBalance>;
}

/**
 * Specialized hook for providing account entities and their current balances.
 */
export function useAccountBalances(): AccountBalancesData & { isLoading: boolean; version: number } {
    const { data, isLoading, version } = useObservable<AccountBalancesData>(
        () => combineLatest([
            accountRepository.observeAll(),
            transactionRepository.observeActiveWithColumns([
                'amount',
                'account_id',
                'currency_code',
                'exchange_rate'
            ]),
            currencyRepository.observeAll()
        ]).pipe(
            debounceTime(300),
            switchMap(async ([accounts, transactions, currencies]) => {
                try {
                    const precisionMap = new Map(currencies.map((currency) => [currency.code, currency.precision]));
                    const balancesByAccountId = balanceService.calculateBalancesFromTransactions(accounts, transactions, precisionMap);

                    return {
                        accounts,
                        balancesByAccountId
                    };
                } catch (error) {
                    logger.error('Failed to calculate account balances:', error);
                    return {
                        accounts: [],
                        balancesByAccountId: new Map()
                    };
                }
            })
        ),
        [],
        {
            accounts: [],
            balancesByAccountId: new Map()
        }
    );

    return {
        ...data,
        isLoading,
        version
    };
}
