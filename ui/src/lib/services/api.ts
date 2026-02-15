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
	},

	progress: {
		submitAttempts: (payload: {
			sessionId: string;
			attempts: Array<{
				itemId: string;
				script: string;
				stepType: string;
				correct: boolean;
				responseTimeMs: number;
				uuidLocal: string;
				userResponse?: string;
				correctAnswer?: string;
			}>;
		}) =>
			fetchApi<{ success: boolean; accepted: number }>('/api/progress/attempts', {
				method: 'POST',
				body: JSON.stringify(payload)
			}),
		getDue: (script: string, limit?: number) =>
			fetchApi<Array<{ itemId: string; nextReviewAt: string }>>(
				`/api/progress/due?script=${encodeURIComponent(script)}${limit != null ? `&limit=${limit}` : ''}`
			),
	},

	user: {
		getProfile: () =>
			fetchApi<{
				id: string;
				email: string;
				createdAt: string;
				reminderEnabled?: boolean;
				reminderTimeLocal?: string;
				timezone?: string;
				nextReminderAt?: string;
			}>('/api/user/profile'),
		updateReminder: (body: {
			reminderEnabled: boolean;
			reminderTimeLocal?: string;
			timezone?: string;
		}) =>
			fetchApi<{
				reminderEnabled: boolean;
				reminderTimeLocal?: string;
				timezone?: string;
				nextReminderAt?: string;
			}>('/api/user/reminder', {
				method: 'PATCH',
				body: JSON.stringify(body)
			}),
		getScripts: () =>
			fetchApi<Array<{ script: string; dailyGoal: number }>>('/api/user/scripts'),
		updateDailyGoal: (script: string, dailyGoal: number) =>
			fetchApi<{ success: boolean; script: string; dailyGoal: number }>('/api/user/daily-goal', {
				method: 'PUT',
				body: JSON.stringify({ script, dailyGoal })
			})
	},

	admin: {
		reset: () =>
			fetchApi<{ success: boolean }>('/api/admin/reset', { method: 'POST' })
	},

	notifications: {
		list: () =>
			fetchApi<Array<{ id: string; type: string; createdAt: string; readAt: string | null }>>(
				'/api/notifications'
			),
		markRead: (id: string) =>
			fetchApi<{ ok: boolean }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
				method: 'PATCH'
			}),
		markAllRead: () =>
			fetchApi<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' })
	}
};
