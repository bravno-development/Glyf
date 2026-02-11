import { writable } from 'svelte/store';

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
			localStorage.setItem('authToken', token);
			set({ user, token, isAuthenticated: true, initialised: true });
		},
		logout: () => {
			localStorage.removeItem('authToken');
			set({ user: null, token: null, isAuthenticated: false, initialised: true });
		},
		init: () => {
			const token = localStorage.getItem('authToken');
			if (token) {
				update(state => ({ ...state, token, isAuthenticated: true, initialised: true }));
			} else {
				update(state => ({ ...state, initialised: true }));
			}
		}
	};
}

export const userStore = createUserStore();
