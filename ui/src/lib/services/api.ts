const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiError {
	error: string;
}

async function fetchApi<T>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const token = localStorage.getItem('authToken');

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token && { Authorization: `Bearer ${token}` }),
			...options.headers
		}
	});

	if (!response.ok) {
		const error: ApiError = await response.json();
		throw new Error(error.error || 'Request failed');
	}

	return response.json();
}

export const api = {
	auth: {
		requestLink: (email: string) =>
			fetchApi<{ message: string }>('/api/auth/request', {
				method: 'POST',
				body: JSON.stringify({ email })
			}),
		verify: (payload: { token: string } | { email: string; code: string }) =>
			fetchApi<{ token: string; user: { id: string; email: string } }>(
				'/api/auth/verify',
				{
					method: 'POST',
					body: JSON.stringify(payload)
				}
			)
	},

	sync: {
		upload: (script: string, reviews: unknown[], lastSync: string) =>
			fetchApi('/api/sync', {
				method: 'POST',
				body: JSON.stringify({ script, reviews, lastSync })
			}),
		download: () => fetchApi('/api/sync')
	},

	onboarding: {
		status: () =>
			fetchApi<{ onboarded: boolean }>('/api/onboarding/status'),
		complete: (script: string, dailyGoal: number) =>
			fetchApi<{ success: boolean }>('/api/onboarding/complete', {
				method: 'POST',
				body: JSON.stringify({ script, dailyGoal })
			})
	}
};
