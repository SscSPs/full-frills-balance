import { expect, test } from './fixtures';

test.describe('Basic Onboarding', () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.clearAppState();
    });

    test('should complete onboarding flow', async ({ onboardingPage }) => {
        await onboardingPage.goto('/');

        await onboardingPage.assertOnboardingStarted();

        await onboardingPage.fillName('Basic User');
        await onboardingPage.clickContinue();

        await onboardingPage.selectCurrency('USD');
        await onboardingPage.clickGetStarted();

        // Should land on accounts or dashboard
        await expect(onboardingPage.page.getByText(/New Account|Dashboard|Hello,/i).first()).toBeVisible({ timeout: 15000 });
    });
});
