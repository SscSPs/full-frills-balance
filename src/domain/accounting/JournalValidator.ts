import { JournalCalculator, JournalLineInput } from './JournalCalculator';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class JournalValidator {
    /**
     * Validates a journal entry against core accounting rules.
     */
    static validate(lines: JournalLineInput[]): ValidationResult {
        const errors: string[] = [];

        // Rule 1: Must have at least 2 lines
        if (lines.length < 2) {
            errors.push('Journal must have at least 2 lines');
        }

        // Rule 2: No zero-amount lines
        if (lines.some(l => l.amount === 0)) {
            errors.push('Lines cannot have zero amount');
        }

        // Rule 3: Must be balanced
        if (!JournalCalculator.isBalanced(lines)) {
            const imbalance = JournalCalculator.calculateImbalance(lines);
            errors.push(`Journal is not balanced. Difference: ${imbalance}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
