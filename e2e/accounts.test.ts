import { expect, test } from './fixtures';

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

    test('should edit an account name', async ({ accountsPage }) => {
        await accountsPage.navigateToCreation();
        await accountsPage.createAccount('To Edit', 'Asset');

        await accountsPage.clickAccount('To Edit');
        await accountsPage.editAccount('Edited Name');

        // Return to list to verify
        await accountsPage.page.getByTestId('header-back-button').click().catch(() => accountsPage.page.goBack());

        await accountsPage.assertAccountVisible('Edited Name');
    });

    test('should delete an account', async ({ accountsPage }) => {
        await accountsPage.navigateToCreation();
        await accountsPage.createAccount('To Delete', 'Asset');

        await accountsPage.clickAccount('To Delete');
        await accountsPage.deleteAccount();

        // Wait and verify it's gone from the list
        await expect(accountsPage.page.getByText('To Delete', { exact: true })).not.toBeVisible();
    });
});
