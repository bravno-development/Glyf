import { writable } from 'svelte/store';
import { trackEvent } from '$lib/services/analytics';
import { StorageKey } from '$lib/constants/storageKeys';

interface User {
	id: string;
	email: string;
}

interface UserState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	initialised: boolean;
}

function createUserStore() {
	const { subscribe, set, update } = writable<UserState>({
		user: null,
		token: null,
		isAuthenticated: false,
		initialised: false
	});

	return {
		subscribe,
		login: (user: User, token: string) => {
			localStorage.setItem(StorageKey.AuthToken, token);
			set({ user, token, isAuthenticated: true, initialised: true });
		},
		logout: () => {
			trackEvent('user_logged_out');
			localStorage.removeItem(StorageKey.AuthToken);
			set({ user: null, token: null, isAuthenticated: false, initialised: true });
			// Clear HttpOnly refresh token cookie server-side (fire & forget)
			import('$lib/services/api').then(({ api }) => api.auth.logout()).catch(() => {});
		},
		init: () => {
			const token = localStorage.getItem(StorageKey.AuthToken);
			if (token) {
				update(state => ({ ...state, token, isAuthenticated: true, initialised: true }));
			} else {
				update(state => ({ ...state, initialised: true }));
			}
		}
	};
}

export const userStore = createUserStore();
