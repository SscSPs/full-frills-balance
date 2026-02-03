import { expect, test } from './fixtures';

test.describe('Multi-currency Workflows', () => {
    test.setTimeout(120 * 1000);

    test.beforeEach(async ({ onboardingPage, accountsPage }) => {
        await onboardingPage.clearAppState();
        await onboardingPage.goto('/');
        await onboardingPage.completeOnboarding('FX User', 'USD');

        // Setup accounts in different currencies
        await accountsPage.navigateToCreation();
        // Assuming the UI has a way to select currency in AccountCreation
        // For now we test with default and then another
        await accountsPage.createAccount('USD Account', 'Asset');
    });

    test('should handle transactions between different currencies', async ({ dashboardPage, journalEntryPage, accountsPage }) => {
        // Create EUR account
        await accountsPage.navigateToCreation();
        await accountsPage.page.getByPlaceholder(/Account Name|e\.g\./i).fill('EUR Account');
        await accountsPage.page.getByText('Asset', { exact: true }).click();

        // Find currency selector and change to EUR
        await accountsPage.page.getByText('USD $').click();
        await accountsPage.page.getByText('EuroEUR€').click();

        await accountsPage.page.getByText(/Create Account|Save Changes/i).click();
        await accountsPage.assertAccountVisible('EUR Account');

        //navigate to dashboard
        await dashboardPage.switchToDashboard();

        // Create Income in EUR
        await dashboardPage.clickPlusButton();
        await journalEntryPage.selectType('INCOME');
        await journalEntryPage.enterAmount('100');
        await journalEntryPage.selectDestinationAccount('EUR Account');
        // Source would be "Reporting Income" or similar, but for simplicty we just use whatever is default
        await journalEntryPage.enterDescription('Euro Salary');

        //wait 1000 ms for save to be enabled
        await journalEntryPage.page.waitForTimeout(1000);
        await journalEntryPage.assertSaveEnabled();
        await journalEntryPage.save();
        //verify that the save is successful, by checking the current page is changed by chekcing url to not be 'journal-entry'
        await expect(journalEntryPage.page).not.toHaveURL(/journal-entry/);

        // Verify on Dashboard
        await dashboardPage.switchToDashboard();
        await expect(dashboardPage.page.getByText('Euro Salary')).toBeVisible();

        // Net Worth calculation check: 100 EUR converted to USD
        // We might need to handle the prompt if exchange rate is missing
    });
});
