import { db, type Review, type Character, type Session } from './db';
import { getDueCards } from './srs';

export type MasteryLevel = 'mastered' | 'good' | 'learning' | 'difficult' | 'new';

export function getMasteryLevel(review: Review | undefined): MasteryLevel {
	if (!review || review.repetitions === 0) return 'new';
	if (review.interval >= 21) return 'mastered';
	if (review.interval >= 6) return 'good';
	if (review.interval >= 1) return 'learning';
	return 'difficult';
}

export function getMasteryColour(level: MasteryLevel): string {
	switch (level) {
		case 'mastered': return 'var(--color-success)';
		case 'good': return 'var(--accent-light-green)';
		case 'learning': return 'var(--color-warning)';
		case 'difficult': return 'var(--color-error)';
		case 'new': return 'var(--mastery-new)';
	}
}

export interface DashboardStats {
	learnt: number;
	accuracy: number;
	dueToday: number;
}

export async function getDashboardStats(script: string): Promise<DashboardStats> {
	const reviews = await db.reviews.where('script').equals(script).toArray();
	const learnt = reviews.filter(r => r.repetitions > 0).length;

	const withReps = reviews.filter(r => r.repetitions > 0);
	const accurate = withReps.filter(r => r.easeFactor >= 2.5).length;
	const accuracy = withReps.length > 0 ? Math.round((accurate / withReps.length) * 100) : 0;

	const dueCards = await getDueCards(script, db);
	const dueToday = dueCards.length;

	return { learnt, accuracy, dueToday };
}

export interface CharacterGridItem {
	character: string;
	reading: string;
	mastery: MasteryLevel;
}

export async function getCharacterGrid(script: string): Promise<CharacterGridItem[]> {
	const characters = await db.characters.where('script').equals(script).toArray();
	const reviews = await db.reviews.where('script').equals(script).toArray();
	const reviewMap = new Map<string, Review>();
	for (const r of reviews) {
		reviewMap.set(r.itemId, r);
	}

	return characters.map((c: Character) => ({
		character: c.character,
		reading: c.readings?.[0] ?? c.meaning,
		mastery: getMasteryLevel(reviewMap.get(c.id)),
	}));
}

export interface MasteryBreakdown {
	mastered: number;
	good: number;
	learning: number;
	difficult: number;
	new: number;
}

export async function getMasteryBreakdown(script: string): Promise<MasteryBreakdown> {
	const characters = await db.characters.where('script').equals(script).toArray();
	const reviews = await db.reviews.where('script').equals(script).toArray();
	const reviewMap = new Map<string, Review>();
	for (const r of reviews) {
		reviewMap.set(r.itemId, r);
	}

	const breakdown: MasteryBreakdown = { mastered: 0, good: 0, learning: 0, difficult: 0, new: 0 };
	for (const c of characters) {
		const level = getMasteryLevel(reviewMap.get(c.id));
		breakdown[level]++;
	}
	return breakdown;
}

export interface ScriptProgressItem {
	script: string;
	label: string;
	percentage: number;
	total: number;
	learnt: number;
}

export async function getScriptProgress(): Promise<ScriptProgressItem[]> {
	const { getAvailableScripts } = await import('./scripts');
	const defs = await getAvailableScripts();
	const results: ScriptProgressItem[] = [];

	for (const def of defs) {
		const total = await db.characters.where('script').equals(def.id).count();
		if (total === 0) continue;
		const reviews = await db.reviews.where('script').equals(def.id).toArray();
		const learnt = reviews.filter(r => r.repetitions > 0).length;
		const percentage = Math.round((learnt / total) * 100);
		results.push({ script: def.id, label: def.name, percentage, total, learnt });
	}

	return results;
}

export interface UpcomingReviewItem {
	character: string;
	reading: string;
	interval: number;
	dueIn: string;
}

export async function getUpcomingReviews(script: string, limit = 4): Promise<UpcomingReviewItem[]> {
	const now = new Date();
	const reviews = await db.reviews.where('script').equals(script).toArray();
	const upcoming = reviews
		.filter(r => r.repetitions > 0)
		.sort((a, b) => new Date(a.nextReview).getTime() - new Date(b.nextReview).getTime())
		.slice(0, limit);

	const characters = await db.characters.where('script').equals(script).toArray();
	const charMap = new Map<string, Character>();
	for (const c of characters) {
		charMap.set(c.id, c);
	}

	return upcoming.map(r => {
		const char = charMap.get(r.itemId);
		const due = new Date(r.nextReview);
		const diffMs = due.getTime() - now.getTime();
		let dueIn: string;
		if (diffMs <= 0) {
			dueIn = 'Now';
		} else if (diffMs < 3600000) {
			dueIn = `${Math.round(diffMs / 60000)}m`;
		} else if (diffMs < 86400000) {
			dueIn = `${Math.round(diffMs / 3600000)}h`;
		} else {
			dueIn = `${Math.round(diffMs / 86400000)}d`;
		}

		return {
			character: char?.character ?? '?',
			reading: char?.readings?.[0] ?? char?.meaning ?? '',
			interval: r.interval,
			dueIn,
		};
	});
}

export interface WeeklyActivityItem {
	day: string;
	count: number;
}

export async function getWeeklyActivity(): Promise<WeeklyActivityItem[]> {
	const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
	const now = new Date();
	const today = now.getDay(); // 0=Sun, 1=Mon...
	const mondayOffset = today === 0 ? 6 : today - 1;

	const monday = new Date(now);
	monday.setDate(now.getDate() - mondayOffset);
	monday.setHours(0, 0, 0, 0);

	const sessions = await db.sessions.toArray();

	const result: WeeklyActivityItem[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		const dateStr = d.toISOString().split('T')[0];

		const count = sessions
			.filter((s: Session) => s.date === dateStr)
			.reduce((sum: number, s: Session) => sum + s.cardsReviewed, 0);

		result.push({ day: dayLabels[i], count });
	}

	return result;
}
