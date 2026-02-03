import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export class OnboardingPage extends BasePage {
    async completeOnboarding(userName: string = 'Test User', currency: string = 'USD') {
        const welcome = this.page.getByText('Welcome to Balance');
        await welcome.waitFor({ state: 'visible', timeout: 3000 });

        await this.page.getByPlaceholder('Enter your name').fill(userName);
        await this.page.getByText('Continue', { exact: true }).click({ force: true });

        await expect(this.page.getByText('Default Currency', { exact: true })).toBeVisible({ timeout: 2000 });
        await this.page.getByText(currency).first().click();
        await this.page.getByText('Get Started').click({ force: true });

        await expect(this.page.getByText(/New Account|Account Name|Dashboard|Journal|Hello,/i).first()).toBeVisible({ timeout: 3000 });
        //expect the page to be changed to '/account-creation'
        await expect(this.page).toHaveURL(/\/account-creation$/);
        await this.page.getByRole('textbox', { name: 'e.g., Checking Account' }).fill('Cash');
        await this.page.getByText('Asset').click();
        await this.page.locator('div').filter({ hasText: /^Create Account$/ }).first().click();
        await expect(this.page).toHaveURL(/accounts$/);
        // now click on the dashboard tab
        await this.page.locator('[role="tablist"]').getByText('Dashboard').click({ force: true });
        await expect(this.page.getByText('Hello')).toBeVisible({ timeout: 1500 });
    }

    async assertOnboardingStarted() {
        await expect(this.page.getByText('Welcome to Balance')).toBeVisible({ timeout: 1500 });
    }

    async fillName(name: string) {
        await this.page.getByPlaceholder('Enter your name').fill(name);
    }

    async clickContinue() {
        await this.page.getByText('Continue', { exact: true }).click();
    }

    async selectCurrency(currency: string) {
        await this.page.getByText(currency).first().click();
    }

    async clickGetStarted() {
        await this.page.getByText('Get Started').click();
    }
}
