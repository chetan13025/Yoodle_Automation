import { test, expect } from '@playwright/test';

test('send a message to Chetan Patil', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'This test sends a live message and runs in Chromium only.'
  );

  // Credentials
  const email = 'anil.kakamari@yopmail.com';
  const password = 'Password1!';

  // Open the login page
  await page.goto(
    'https://qa.ss.set.digitalharbor.us/yoodle-new/secure/chat',
    { waitUntil: 'domcontentloaded' }
  );

  const emailInput = page.getByPlaceholder('Email');

  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(email);
    await page.getByPlaceholder('Password').fill(password);

    await page.getByRole('button', {
      name: 'Login',
      exact: true,
    }).click();
  }

  // Verify login
  const accountMenu = page.getByRole('button', {
    name: 'Account menu',
  });

  await expect(accountMenu).toBeVisible({ timeout: 60_000 });

  // Open Chetan Patil's conversation
  const chetanTab = page.getByRole('tab', {
    name: 'Chetan Patil',
    exact: true,
  });

  await expect(chetanTab).toBeVisible({ timeout: 15_000 });
  await chetanTab.click();

  await expect(
    page.getByRole('heading', {
      name: 'Chetan Patil',
      exact: true,
    })
  ).toBeVisible();

  // Compose the message
  const message = `Hi ${Date.now()}`;

  const composer = page.getByRole('textbox', {
    name: 'Write your message…',
  });

  await expect(composer).toBeVisible();
  await composer.fill(message);

  // Verify the textbox value
  await expect(composer).toHaveValue(message);

  // Send the message
  await page.getByTestId('message-composer__send').click();

  // Verify the message was sent
  await expect(
    page.getByRole('log', { name: 'Messages' })
  ).toContainText(message, { timeout: 15_000 });
});