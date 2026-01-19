import { AppButton, AppCard, AppInput, AppText } from '@/components/core';
import { AppConfig, Spacing } from '@/constants';
import { useTheme } from '@/hooks/use-theme';
import { AccountType } from '@/src/data/models/Account';
import { TransactionType } from '@/src/data/models/Transaction';
import { CreateJournalData, journalRepository } from '@/src/data/repositories/JournalRepository';
import { JournalCalculator, JournalLineInput } from '@/src/domain/accounting/JournalCalculator';
import { JournalValidator } from '@/src/domain/accounting/JournalValidator';
import { showErrorAlert, showSuccessAlert } from '@/src/utils/alerts';
import { sanitizeAmount } from '@/src/utils/validation';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { JournalEntryLine, JournalLineItem } from './JournalLineItem';
import { JournalSummary } from './JournalSummary';

interface AdvancedJournalFormProps {
    accounts: any[];
    onSuccess: () => void;
    onSelectAccountRequest: (lineId: string) => void;
    lines: JournalEntryLine[];
    setLines: (lines: JournalEntryLine[]) => void;
    initialDescription?: string;
    initialDate?: string;
    isEdit?: boolean;
    journalId?: string;
}

export const AdvancedJournalForm = ({
    accounts,
    onSuccess,
    onSelectAccountRequest,
    lines,
    setLines,
    initialDescription = '',
    initialDate = new Date().toISOString().split('T')[0],
    isEdit = false,
    journalId
}: AdvancedJournalFormProps) => {
    const router = useRouter();
    const { theme } = useTheme();
    const [description, setDescription] = useState(initialDescription);
    const [journalDate, setJournalDate] = useState(initialDate);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update local state if initial values change (e.g. after async load in parent)
    React.useEffect(() => {
        if (initialDescription) setDescription(initialDescription);
        if (initialDate) setJournalDate(initialDate);
    }, [initialDescription, initialDate]);

    const addLine = () => {
        const newId = (Math.max(...lines.map(l => parseInt(l.id))) + 1).toString();
        setLines([...lines, {
            id: newId,
            accountId: '',
            accountName: '',
            accountType: AccountType.ASSET,
            amount: '',
            transactionType: TransactionType.DEBIT,
            notes: '',
            exchangeRate: ''
        }]);
    };

    const removeLine = (id: string) => {
        if (lines.length > 2) {
            setLines(lines.filter(line => line.id !== id));
        }
    };

    const updateLine = (id: string, field: keyof JournalEntryLine, value: any) => {
        setLines(lines.map(line =>
            line.id === id ? { ...line, [field]: value } : line
        ));
    };

    const getLineBaseAmount = (line: JournalEntryLine): number => {
        const amount = sanitizeAmount(line.amount) || 0;
        const rate = line.exchangeRate && parseFloat(line.exchangeRate) ? parseFloat(line.exchangeRate) : 1;
        if (!line.accountCurrency || line.accountCurrency === AppConfig.defaultCurrency) {
            return amount;
        }
        const baseAmount = amount / rate;
        return Math.round(baseAmount * 100) / 100;
    };

    const getDomainLines = (): JournalLineInput[] => {
        return lines.map(line => ({
            amount: getLineBaseAmount(line),
            type: line.transactionType
        }));
    };

    const getTotalDebits = () => JournalCalculator.calculateTotalDebits(getDomainLines());
    const getTotalCredits = () => JournalCalculator.calculateTotalCredits(getDomainLines());
    const validationResult = JournalValidator.validate(getDomainLines());
    const isBalanced = JournalCalculator.isBalanced(getDomainLines());

    const validateJournal = () => {
        if (!description.trim()) {
            return { valid: false, error: 'Description is required' };
        }
        if (lines.some(line => !line.accountId)) {
            return { valid: false, error: 'All lines must have an account selected' };
        }
        if (!validationResult.isValid) {
            const balanceError = validationResult.errors.find(e => e.includes('balanced'));
            return { valid: false, error: balanceError || validationResult.errors[0] };
        }
        return { valid: true, error: null };
    };

    const createJournal = async () => {
        const validation = validateJournal();
        if (!validation.valid) {
            Alert.alert('Validation Error', validation.error || 'Validation failed');
            return;
        }

        setIsSubmitting(true);
        try {
            const journalData: CreateJournalData = {
                journalDate: new Date(journalDate).getTime(),
                description: description.trim() || undefined,
                currencyCode: AppConfig.defaultCurrency,
                transactions: lines.map(line => ({
                    accountId: line.accountId,
                    amount: sanitizeAmount(line.amount) || 0,
                    transactionType: line.transactionType,
                    notes: line.notes.trim() || undefined,
                    exchangeRate: line.exchangeRate && line.exchangeRate.trim()
                        ? parseFloat(line.exchangeRate)
                        : undefined,
                }))
            };

            if (isEdit && journalId) {
                // Use proper update method that recalculates denormalized fields
                await journalRepository.updateJournalWithTransactions(journalId, journalData);
                showSuccessAlert('Success', 'Journal entry updated successfully');
            } else {
                await journalRepository.createJournalWithTransactions(journalData);
                showSuccessAlert('Success', 'Journal entry created successfully');
            }
            onSuccess();
        } catch (error) {
            console.error('Failed to save journal:', error);
            showErrorAlert('Failed to save journal entry');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View>
            <AppCard elevation="sm" padding="lg" style={styles.titleCard}>
                <AppText variant="title">{isEdit ? 'Edit Journal Entry' : 'Create Journal Entry'}</AppText>
            </AppCard>

            <AppCard elevation="sm" padding="lg" style={styles.inputCard}>
                <AppInput
                    label="Date"
                    value={journalDate}
                    onChangeText={setJournalDate}
                    placeholder="YYYY-MM-DD"
                    containerStyle={{ marginBottom: Spacing.md }}
                />

                <AppInput
                    label="Description"
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter description"
                    multiline
                    numberOfLines={3}
                    style={styles.textArea}
                />
            </AppCard>

            <AppCard elevation="sm" padding="lg" style={styles.linesCard}>
                <View style={styles.linesHeader}>
                    <AppText variant="heading">Journal Lines</AppText>
                    <TouchableOpacity onPress={addLine} style={styles.addButton}>
                        <AppText variant="body" color="primary">+ Add Line</AppText>
                    </TouchableOpacity>
                </View>

                {lines.map((line, index) => (
                    <JournalLineItem
                        key={line.id}
                        line={line}
                        index={index}
                        canRemove={lines.length > 2}
                        onUpdate={(field, value) => updateLine(line.id, field, value)}
                        onRemove={() => removeLine(line.id)}
                        onSelectAccount={() => onSelectAccountRequest(line.id)}
                        getLineBaseAmount={getLineBaseAmount}
                    />
                ))}
            </AppCard>

            <JournalSummary
                totalDebits={getTotalDebits()}
                totalCredits={getTotalCredits()}
                isBalanced={isBalanced}
            />

            <View style={styles.actions}>
                <AppButton
                    variant="primary"
                    onPress={createJournal}
                    disabled={!isBalanced || isSubmitting}
                    style={styles.createButton}
                >
                    {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Journal' : 'Create Journal')}
                </AppButton>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    titleCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    inputCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    linesCard: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    linesHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    addButton: {
        padding: Spacing.sm,
    },
    actions: {
        padding: Spacing.lg,
    },
    createButton: {
        marginBottom: Spacing.xl,
    },
});
