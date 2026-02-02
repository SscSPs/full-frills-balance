import { test } from './fixtures';

test.describe('Basic Account Management', () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.clearAppState();
        await onboardingPage.goto('/');
        await onboardingPage.completeOnboarding('Account User');
    });

    test('should create an asset account', async ({ accountsPage }) => {
        await accountsPage.navigateToCreation();

        await accountsPage.createAccount('Main Checking', 'Asset');

        await accountsPage.assertAccountVisible('Main Checking');
    });
});
