import { expect } from '@playwright/test';
import { BasePage } from './base-page';

export class OnboardingPage extends BasePage {
    async completeOnboarding(userName: string = 'Test User', currency: string = 'USD') {
        const welcome = this.page.getByText('Welcome to Balance');
        const dashboard = this.page.getByText(/Hello,|Dashboard|Journal/i);

        await Promise.race([
            welcome.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { }),
            dashboard.waitFor({ state: 'visible', timeout: 15000 }).catch(() => { })
        ]);

        if (await welcome.isVisible()) {
            await this.page.getByPlaceholder('Enter your name').fill(userName);
            await this.page.getByText('Continue', { exact: true }).click({ force: true });

            await expect(this.page.getByText('Default Currency', { exact: true })).toBeVisible({ timeout: 10000 });
            await this.page.getByText(currency).first().click();
            await this.page.getByText('Get Started').click({ force: true });

            await expect(this.page.getByText(/New Account|Account Name|Dashboard|Journal/i).first()).toBeVisible({ timeout: 15000 });
        }
    }

    async assertOnboardingStarted() {
        await expect(this.page.getByText('Welcome to Balance')).toBeVisible({ timeout: 15000 });
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
