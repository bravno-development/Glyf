import { db } from "./db";

export interface ScriptCharacter {
	id: string;
	order?: number;
	character: string;
	meaning: string;
	readings: string[];
}

export interface ScriptExtraCharacter {
	character: string;
	meaning: string;
	readings?: string[];
}

export interface ScriptExtraSection {
	title: string;
	characters: ScriptExtraCharacter[];
}

export interface CourseLesson {
	id: string;
	title: string;
	characterIds?: string[];
	extraTitles?: string[];
}

export interface ScriptDefinition {
	id: string;
	version?: number;
	language: string;
	name: string;
	description: string;
	icon: string;
	available: boolean;
	totalCharacters: number;
	lowercaseFriendly?: boolean;
	characters: ScriptCharacter[];
	extra?: ScriptExtraSection[];
	course?: { lessons: CourseLesson[] };
}

export interface LessonContentRow {
	character: string;
	meaning: string;
	order: number;
}

/** Resolve a lesson to content rows (characterIds → characters by id; extraTitles → extra sections by title). */
export function getLessonContent(
	def: ScriptDefinition,
	lesson: CourseLesson,
): LessonContentRow[] {
	const rows: LessonContentRow[] = [];
	const charMap = new Map(def.characters.map((c) => [c.id, c]));
	let order = 0;
	if (lesson.characterIds?.length) {
		for (const id of lesson.characterIds) {
			const c = charMap.get(id);
			if (c)
				rows.push({
					character: c.character,
					meaning: c.meaning,
					order: order++,
				});
		}
	}
	if (lesson.extraTitles?.length && def.extra?.length) {
		const extraByTitle = new Map(def.extra.map((s) => [s.title, s]));
		for (const title of lesson.extraTitles) {
			const section = extraByTitle.get(title);
			if (section) {
				for (const c of section.characters) {
					rows.push({
						character: c.character,
						meaning: c.meaning,
						order: order++,
					});
				}
			}
		}
	}
	return rows;
}

/** Return characters in display order (by `order` field, then array index). */
export function getCharactersInOrder(def: ScriptDefinition): ScriptCharacter[] {
	if (!def.characters?.length) return [];
	return [...def.characters].sort(
		(a, b) => (a.order ?? 999) - (b.order ?? 999),
	);
}

const cache = new Map<string, ScriptDefinition>();
let manifestCache: string[] | null = null;

async function fetchManifest(): Promise<string[]> {
	if (manifestCache) return manifestCache;
	const res = await fetch("/scripts/index.json");
	manifestCache = await res.json();
	return manifestCache!;
}

async function fetchScript(id: string): Promise<ScriptDefinition> {
	const cached = cache.get(id);
	if (cached) return cached;
	const res = await fetch(`/scripts/${id}.json`);
	const def: ScriptDefinition = await res.json();
	cache.set(id, def);
	return def;
}

export async function getAvailableScripts(): Promise<ScriptDefinition[]> {
	const ids = await fetchManifest();
	return Promise.all(ids.map(fetchScript));
}

export async function getScript(id: string): Promise<ScriptDefinition> {
	return fetchScript(id);
}

export async function seedCharacters(scriptId: string): Promise<void> {
	const def = await fetchScript(scriptId);
	const currentVersion = def.version ?? 1;
	const syncState = await db.syncState.get(scriptId);

	if (syncState?.seededVersion === currentVersion) return;

	const records = def.characters.map((c) => ({
		id: c.id,
		script: def.id,
		character: c.character,
		meaning: c.meaning,
		readings: c.readings,
	}));
	await db.characters.bulkPut(records);

	await db.syncState.put({
		script: scriptId,
		lastSync: syncState?.lastSync ?? '',
		pendingChanges: syncState?.pendingChanges ?? false,
		seededVersion: currentVersion,
	});
}

export async function seedAllCharacters(): Promise<void> {
	const ids = await fetchManifest();
	await Promise.all(ids.map(seedCharacters));
}
