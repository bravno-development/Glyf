import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios';
import { browser } from '$app/environment';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import { StorageKey } from '$lib/constants/storageKeys';

const API_URL = import.meta.env.VITE_API_URL || '';

// Lazy singleton — created once on first use, avoids SSR issues
let _client: AxiosInstance | null = null;

function getClient(): AxiosInstance {
	if (_client) return _client;

	_client = axios.create({
		baseURL: API_URL,
		withCredentials: true,  // sends HttpOnly refresh-token cookie automatically
		headers: { 'Content-Type': 'application/json' }
	});

	// Attach access token to every outgoing request
	_client.interceptors.request.use(config => {
		const token = localStorage.getItem(StorageKey.AuthToken);
		if (token) config.headers.Authorization = `Bearer ${token}`;
		return config;
	});

	// Refresh logic — lib calls this once on 401; all other in-flight requests are queued
	const refreshAuthLogic = async (failedRequest: AxiosError) => {
		// Guard: if the refresh request itself 401s, bail out immediately to avoid infinite loop
		if (failedRequest.config?.url?.includes('/api/auth/refresh')) {
			if (browser) {
				const { userStore } = await import('$lib/stores/user');
				userStore.logout();
			}
			return Promise.reject(failedRequest);
		}

		try {
			const { data } = await _client!.post<{ token: string }>('/api/auth/refresh');
			localStorage.setItem(StorageKey.AuthToken, data.token);
			// Patch the queued request's auth header so the lib can replay it correctly
			if (failedRequest.config?.headers) {
				failedRequest.config.headers.Authorization = `Bearer ${data.token}`;
			}
			return Promise.resolve();
		} catch (error) {
			if (browser) {
				const { userStore } = await import('$lib/stores/user');
				userStore.logout();
			}
			return Promise.reject(error);
		}
	};

	createAuthRefreshInterceptor(_client, refreshAuthLogic, {
		statusCodes: [401],
		skipWhileRefreshing: true,  // don't intercept requests made during refresh itself
		retryInstance: _client,
		onRetry: (config: AxiosRequestConfig) => config
	});

	return _client;
}

// Typed helper
async function req<T>(endpoint: string, config: AxiosRequestConfig = {}): Promise<T> {
	const { data } = await getClient().request<T>({ url: endpoint, ...config });
	return data;
}

type VerifyPayload = ({ token: string } | { email: string; code: string }) & { rememberMe?: boolean };

export const api = {
	auth: {
		requestLink: (email: string) =>
			req<{ message: string }>('/api/auth/request', { method: 'POST', data: { email } }),
		verify: (payload: VerifyPayload) =>
			req<{ token: string; user: { id: string; email: string } }>('/api/auth/verify', {
				method: 'POST', data: payload
			}),
		logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' })
	},

	sync: {
		upload: (script: string, reviews: unknown[], lastSync: string) =>
			req('/api/sync', { method: 'POST', data: { script, reviews, lastSync } }),
		download: () => req('/api/sync')
	},

	onboarding: {
		status: () => req<{ onboarded: boolean }>('/api/onboarding/status'),
		complete: (script: string, dailyGoal: number) =>
			req<{ success: boolean }>('/api/onboarding/complete', {
				method: 'POST', data: { script, dailyGoal }
			})
	},

	progress: {
		submitAttempts: (payload: {
			sessionId: string;
			attempts: Array<{
				itemId: string; script: string; stepType: string; correct: boolean;
				responseTimeMs: number; uuidLocal: string; userResponse?: string; correctAnswer?: string;
			}>;
		}) =>
			req<{ success: boolean; accepted: number }>('/api/progress/attempts', {
				method: 'POST', data: payload
			}),
		getDue: (script: string, limit?: number) =>
			req<Array<{ itemId: string; nextReviewAt: string }>>(
				`/api/progress/due?script=${encodeURIComponent(script)}${limit != null ? `&limit=${limit}` : ''}`
			)
	},

	user: {
		getProfile: () =>
			req<{
				id: string; email: string; createdAt: string;
				reminderEnabled?: boolean; reminderTimeLocal?: string;
				timezone?: string; nextReminderAt?: string;
			}>('/api/user/profile'),
		updateReminder: (body: {
			reminderEnabled: boolean; reminderTimeLocal?: string; timezone?: string;
		}) =>
			req<{
				reminderEnabled: boolean; reminderTimeLocal?: string;
				timezone?: string; nextReminderAt?: string;
			}>('/api/user/reminder', { method: 'PATCH', data: body }),
		getScripts: () =>
			req<Array<{ script: string; dailyGoal: number }>>('/api/user/scripts'),
		updateDailyGoal: (script: string, dailyGoal: number) =>
			req<{ success: boolean; script: string; dailyGoal: number }>('/api/user/daily-goal', {
				method: 'PUT', data: { script, dailyGoal }
			})
	},

	admin: {
		reset: () => req<{ success: boolean }>('/api/admin/reset', { method: 'POST' })
	},

	notifications: {
		list: () =>
			req<Array<{ id: string; type: string; createdAt: string; readAt: string | null }>>(
				'/api/notifications'
			),
		markRead: (id: string) =>
			req<{ ok: boolean }>(`/api/notifications/${encodeURIComponent(id)}/read`, {
				method: 'PATCH'
			}),
		markAllRead: () =>
			req<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' })
	}
};
