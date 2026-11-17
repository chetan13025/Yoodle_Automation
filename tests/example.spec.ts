import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();

const accountMenu = page.getByRole('button', { name: 'Account menu' });
    await expect(accountMenu).toBeVisible({ timeout: 60_000 });
    await accountMenu.click();

    const logOutOption = page.getByRole('menuitem', { name: /log out/i })
      .or(page.getByRole('button', { name: /log out/i }))
      .last();
    await expect(logOutOption).toBeVisible({ timeout: 60_000 });
    await logOutOption.click();

    const signOutAllButton = page.getByRole('button', {
      name: 'Sign out of all accounts',
      exact: true,
    });
    await expect(signOutAllButton).toBeVisible({ timeout: 60_000 });
    await signOutAllButton.click();

    await expect(page.getByPlaceholder('Email')).toBeVisible({ timeout: 60_000 });
    await attachScreenshot('sign-out-of-all-accounts');



});
