import { SelectableGrid, SelectableItem } from '@/src/components/common/SelectableGrid';
import { IconName } from '@/src/components/core/AppIcon';
import { AppConfig } from '@/src/constants/app-config';
import React, { useMemo } from 'react';
import { DEFAULT_ACCOUNTS } from '../constants';

interface StepAccountSuggestionsProps {
    selectedAccounts: string[];
    customAccounts: { name: string; icon: IconName }[];
    onToggleAccount: (name: string) => void;
    onAddCustomAccount: (name: string, type: 'INCOME' | 'EXPENSE', icon: IconName) => void;
    onContinue: () => void;
    onBack: () => void;
    isCompleting: boolean;
}

export const StepAccountSuggestions: React.FC<StepAccountSuggestionsProps> = ({
    selectedAccounts,
    customAccounts,
    onToggleAccount,
    onAddCustomAccount,
    onContinue,
    onBack,
    isCompleting,
}) => {

    const items: SelectableItem[] = useMemo(() => {
        return [
            ...DEFAULT_ACCOUNTS,
            ...customAccounts.map(acc => ({ id: acc.name, name: acc.name, icon: acc.icon })),
        ];
    }, [customAccounts]);

    const handleToggle = (id: string) => {
        const account = items.find(a => (a.id ?? a.name) === id);
        if (account && !selectedAccounts.includes(id)) {
            if (!DEFAULT_ACCOUNTS.some(a => a.name === id) && !customAccounts.some(c => c.name === id)) {
                onAddCustomAccount(id, 'EXPENSE', account.icon || 'wallet');
            }
        }
        onToggleAccount(id);
    };

    return (
        <SelectableGrid
            title={AppConfig.strings.onboarding.accounts.title}
            subtitle={AppConfig.strings.onboarding.accounts.subtitle}
            items={items}
            selectedIds={selectedAccounts}
            onToggle={handleToggle}
            onContinue={onContinue}
            onBack={onBack}
            isCompleting={isCompleting}
            customInput={{
                placeholder: AppConfig.strings.onboarding.accounts.placeholder,
                onAdd: onAddCustomAccount,
                defaultIcon: 'wallet',
            }}
        />
    );
};
