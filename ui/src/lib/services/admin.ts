import { goto } from '$app/navigation';
import { api } from '$lib/services/api';
import { learnStore } from '$lib/stores/learn';

const ADMIN_TIME_STORAGE_KEY = 'glyf_admin_time_offset';

export async function resetAccount(): Promise<void> {
	await api.admin.reset();
	if (typeof indexedDB !== 'undefined') {
		await new Promise<void>((resolve, reject) => {
			const req = indexedDB.deleteDatabase('GlyfDB');
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}
	if (typeof localStorage !== 'undefined') {
		localStorage.removeItem(ADMIN_TIME_STORAGE_KEY);
		localStorage.removeItem('glyf-daily-goal');
		const keysToRemove: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith('glyf_intros_')) keysToRemove.push(key);
		}
		keysToRemove.forEach((k) => localStorage.removeItem(k));
	}
	learnStore.reset();
	goto('/onboarding');
}
