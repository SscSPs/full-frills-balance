import { test as base } from '@playwright/test';
import { AccountsPage } from './pages/accounts-page';
import { OnboardingPage } from './pages/onboarding-page';

type MyFixtures = {
    onboardingPage: OnboardingPage;
    accountsPage: AccountsPage;
};

export const test = base.extend<MyFixtures>({
    onboardingPage: async ({ page }, use) => {
        await use(new OnboardingPage(page));
    },
    accountsPage: async ({ page }, use) => {
        await use(new AccountsPage(page));
    },
});

export { expect } from '@playwright/test';
