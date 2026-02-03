import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export class JournalEntryPage extends BasePage {
    async enterAmount(amount: string) {
        await this.page.getByTestId('amount-input').fill(amount);
    }

    async selectType(type: 'EXPENSE' | 'INCOME' | 'TRANSFER') {
        const typeStart = type.toLowerCase();
        await this.page.getByTestId(`tab-${typeStart}`).click();
    }

    async selectSourceAccount(accountName: string) {
        // Use the testID we added to SimpleForm
        const sanitizedName = accountName.replace(/\s+/g, '-');
        await this.page.getByTestId(`account-option-${sanitizedName}`).click();
    }

    async selectDestinationAccount(accountName: string) {
        // Use the testID we added to SimpleForm
        const sanitizedName = accountName.replace(/\s+/g, '-');
        await this.page.getByTestId(`account-option-${sanitizedName}`).click();
    }

    async enterDescription(description: string) {
        await this.page.getByTestId('description-input').fill(description);
    }

    async save() {
        await this.assertSaveEnabled();
        await this.page.getByTestId('save-button').click();
    }

    async delete() {
        await this.page.getByTestId('delete-button').click();
    }

    async assertSaveDisabled() {
        await expect(this.page.getByTestId('save-button')).toBeDisabled();
    }

    async assertSaveEnabled() {
        await expect(this.page.getByTestId('save-button')).toBeEnabled();
    }

    async assertTransactionVisible(description: string, amount: string) {
        await expect(this.page.getByText(description)).toBeVisible();
        await expect(this.page.getByText(amount)).toBeVisible();
    }
}
