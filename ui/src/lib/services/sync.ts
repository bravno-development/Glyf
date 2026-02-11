import { db, type Review } from './db';
import { api } from './api';

export async function syncToServer(): Promise<void> {
	try {
		const syncStates = await db.syncState.toArray();

		for (const state of syncStates) {
			if (!state.pendingChanges) continue;

			const reviews = await db.reviews.where('script').equals(state.script).toArray();

			await api.sync.upload(state.script, reviews, state.lastSync);

			await db.syncState.update(state.script, {
				lastSync: new Date().toISOString(),
				pendingChanges: false
			});
		}
	} catch (error) {
		console.error('Sync to server failed:', error);
	}
}

export async function syncFromServer(): Promise<void> {
	try {
		const serverData = await api.sync.download() as Array<{
			script: string;
			reviews: Review[];
			lastSync: string;
		}>;

		for (const scriptData of serverData) {
			const localState = await db.syncState.get(scriptData.script);

			if (
				!localState ||
				new Date(scriptData.lastSync) > new Date(localState.lastSync)
			) {
				await db.reviews.bulkPut(scriptData.reviews);
				await db.syncState.put({
					script: scriptData.script,
					lastSync: scriptData.lastSync,
					pendingChanges: false
				});
			}
		}
	} catch (error) {
		console.error('Sync from server failed:', error);
	}
}
