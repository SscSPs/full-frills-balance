import Account from '@/src/data/models/Account';

/**
 * reliable way to get an icon for an account, 
 * handling special cases for system accounts (OBE, Balance Corrections)
 * that might have been created without an icon in older versions.
 */
export function getAccountIcon(account: Account): string {
    if (account.icon) return account.icon;

    // Fallbacks for system accounts based on name
    const lowerName = account.name.toLowerCase();

    // Opening Balances (OBE)
    if (lowerName.includes('opening balance')) {
        return 'scale'; // or 'business' or 'earth'
    }

    // Balance Corrections
    if (lowerName.includes('balance correction')) {
        return 'construct'; // or 'medical' or 'flask'
    }

    // Default fallback
    return 'wallet';
}
