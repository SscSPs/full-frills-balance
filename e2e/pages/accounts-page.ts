import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export class AccountsPage extends BasePage {
    async navigateToCreation() {
        await this.page.goto('/account-creation');
    }

    async createAccount(name: string, type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity') {
        await this.page.getByPlaceholder(/Account Name|e\.g\./i).fill(name);
        await this.page.getByText(type, { exact: true }).click();
        await this.page.getByText('Create Account', { exact: true }).click();
    }

    async assertAccountVisible(name: string) {
        await expect(this.page.getByText(name)).toBeVisible({ timeout: 15000 });
    }
}
