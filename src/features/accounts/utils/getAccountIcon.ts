import { AppConfig } from '@/src/constants';
import Account from '@/src/data/models/Account';

/**
 * reliable way to get an icon for an account, 
 * handling special cases for system accounts (OBE, Balance Corrections)
 * that might have been created without an icon in older versions.
 */
export function getAccountIcon(account: Account): string {
    if (account.icon) return account.icon;

    const { openingBalances, balanceCorrections } = AppConfig.systemAccounts;
    const lowerName = account.name.toLowerCase();

    // Opening Balances (OBE)
    if (lowerName.includes(openingBalances.namePrefix.toLowerCase())) {
        return openingBalances.icon;
    }

    // Balance Corrections
    if (lowerName.includes(balanceCorrections.namePrefix.toLowerCase())) {
        return balanceCorrections.icon;
    }

    // Default fallback
    return 'wallet';
}
