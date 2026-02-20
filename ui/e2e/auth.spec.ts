import { test, expect } from '@playwright/test';

// The app's API client calls http://localhost:8000 by default (VITE_API_URL not set in test builds)
const API = 'http://localhost:8000';

test.describe('Authentication: Magic link login flow', () => {
	test('Given a visitor at /auth/login, When they submit a valid email, Then the code entry screen is shown', async ({
		page
	}) => {
		// Arrange: mock the API so no real email is sent
		await page.route(`${API}/api/auth/request`, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Check your email' }) })
		);

		// Act
		await page.goto('/auth/login');
		await page.fill('input#email', 'test@example.com');
		await page.getByRole('button', { name: 'Continue' }).click();

		// Assert
		await expect(page.getByRole('heading', { name: 'Enter your code' })).toBeVisible();
		await expect(page.getByText('test@example.com')).toBeVisible();
	});

	test('Given a user on the code entry screen, When they submit a code shorter than 6 digits, Then a validation error is shown', async ({
		page
	}) => {
		// Arrange: get to the code step first
		await page.route(`${API}/api/auth/request`, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Check your email' }) })
		);
		await page.goto('/auth/login');
		await page.fill('input#email', 'test@example.com');
		await page.getByRole('button', { name: 'Continue' }).click();
		await expect(page.getByRole('heading', { name: 'Enter your code' })).toBeVisible();

		// Act: enter only 3 digits
		await page.fill('input#code', '123');
		await page.getByRole('button', { name: 'Log in' }).click();

		// Assert
		await expect(page.getByText('Please enter the 6-digit code')).toBeVisible();
	});

	test('Given a user on the code entry screen, When they click "Use a different email", Then they return to the email input step', async ({
		page
	}) => {
		// Arrange: get to the code step
		await page.route(`${API}/api/auth/request`, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Check your email' }) })
		);
		await page.goto('/auth/login');
		await page.fill('input#email', 'test@example.com');
		await page.getByRole('button', { name: 'Continue' }).click();

		// Act
		await page.getByRole('button', { name: 'Use a different email' }).click();

		// Assert: back to the email step
		await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible();
		await expect(page.locator('input#email')).toBeVisible();
	});

	test('Given a magic link URL with a valid token, When /auth/verify loads, Then the user is redirected to /dashboard', async ({
		page
	}) => {
		// Arrange: mock verify to return a valid JWT, and onboarding to say complete
		await page.route(`${API}/api/auth/verify`, (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ token: 'test-jwt', user: { id: '1', email: 'test@example.com' } })
			})
		);
		await page.route(`${API}/api/onboarding/status`, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ onboarded: true }) })
		);
		await page.route(`${API}/api/sync`, (route) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
		);

		// Act
		await page.goto('/auth/verify?token=some-valid-token');

		// Assert: redirected to dashboard
		await expect(page).toHaveURL('/dashboard');
	});

	test('Given a /auth/verify page with no token in the URL, When it loads, Then an error message is shown', async ({
		page
	}) => {
		await page.goto('/auth/verify');
		// No token → "No token provided" error, and a link back to login
		await expect(page.getByText('Try logging in again')).toBeVisible();
	});
});
