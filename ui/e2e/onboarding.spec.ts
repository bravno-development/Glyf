import { test, expect } from '@playwright/test';

const API = 'http://localhost:8000';

// Seed auth token and stub the minimum set of API calls that fire on every page load
async function setupAuth(page: import('@playwright/test').Page, onboarded = false) {
	// Seed auth token before the app boots
	await page.addInitScript(() => {
		localStorage.setItem('authToken', 'e2e-test-token');
	});

	// Stub sync calls (fired by layout when authenticated)
	await page.route(`${API}/api/sync`, (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);

	// Stub onboarding status (queried by the onboarding page itself)
	const status = { onboarded };
	await page.route(`${API}/api/onboarding/status`, (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status) })
	);

	// Stub reminder update (Step 3 buttons)
	await page.route(`${API}/api/user/reminder`, (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reminderEnabled: true }) })
	);

	// Stub onboarding completion (Step 4 "Start learning" button)
	await page.route(`${API}/api/onboarding/complete`, (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
	);

	// Stub learn store (called when landing on dashboard after onboarding)
	await page.route(`${API}/api/user/scripts`, (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
	);
}

test.describe('Onboarding wizard', () => {
	test('Given a new user, When /onboarding loads, Then Step 1 is shown with step-progress dots', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		// Step dots are rendered by StepDots component
		await expect(page.locator('[data-testid="step-dots"], .step-dots, [class*="step"]').first()).toBeVisible();
		// "Continue" is visible on step 1 and 2
		await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
	});

	test('Given the user is on Step 1, When they click Continue, Then Step 2 (daily goal) is shown', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		await page.getByRole('button', { name: 'Continue' }).click();

		// Step 2 shows a hint about settings
		await expect(page.getByText('You can change this anytime in Settings')).toBeVisible();
	});

	test('Given the user is on Step 2, When they click Back, Then Step 1 is shown again', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		// Advance to step 2
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect(page.getByText('You can change this anytime in Settings')).toBeVisible();

		// Go back
		await page.getByRole('button', { name: 'Back' }).click();

		// Step 2 hint text should no longer be visible
		await expect(page.getByText('You can change this anytime in Settings')).not.toBeVisible();
		// Continue button returns
		await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
	});

	test('Given the user reaches Step 3, When they click "Set reminder", Then Step 4 is shown', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		// Step 1 → 2 → 3
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByRole('button', { name: 'Set reminder' }).click();

		// Step 4 has "Start learning" button
		await expect(page.getByRole('button', { name: 'Start learning' })).toBeVisible();
	});

	test('Given the user reaches Step 3, When they click "Skip for now", Then Step 4 is shown', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();

		await page.getByRole('button', { name: 'Skip for now' }).click();

		await expect(page.getByRole('button', { name: 'Start learning' })).toBeVisible();
	});

	test('Given the user is on Step 4, When they click "Start learning", Then they are redirected to /dashboard', async ({
		page
	}) => {
		await setupAuth(page, false);
		await page.goto('/onboarding');

		// Navigate to step 4 via skip
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Continue' }).click();
		await page.getByRole('button', { name: 'Skip for now' }).click();

		await page.getByRole('button', { name: 'Start learning' }).click();

		await expect(page).toHaveURL('/dashboard');
	});

	test('Given an already-onboarded user, When they navigate to /onboarding, Then they are immediately redirected to /dashboard', async ({
		page
	}) => {
		await setupAuth(page, true); // onboarded = true
		await page.goto('/onboarding');

		await expect(page).toHaveURL('/dashboard');
	});
});
