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

export interface CoursePhase {
	id: string;
	title: string;
	characterIds?: string[];
	extraTitles?: string[];
}

export interface ScriptDefinition {
	id: string;
	language: string;
	name: string;
	description: string;
	icon: string;
	available: boolean;
	totalCharacters: number;
	lowercaseFriendly?: boolean;
	characters: ScriptCharacter[];
	extra?: ScriptExtraSection[];
	course?: { phases: CoursePhase[] };
}

export interface PhaseContentRow {
	character: string;
	meaning: string;
	order: number;
}

/** Resolve a phase to content rows (characterIds → characters by id; extraTitles → extra sections by title). */
export function getPhaseContent(
	def: ScriptDefinition,
	phase: CoursePhase,
): PhaseContentRow[] {
	const rows: PhaseContentRow[] = [];
	const charMap = new Map(def.characters.map((c) => [c.id, c]));
	let order = 0;
	if (phase.characterIds?.length) {
		for (const id of phase.characterIds) {
			const c = charMap.get(id);
			if (c)
				rows.push({
					character: c.character,
					meaning: c.meaning,
					order: order++,
				});
		}
	}
	if (phase.extraTitles?.length && def.extra?.length) {
		const extraByTitle = new Map(def.extra.map((s) => [s.title, s]));
		for (const title of phase.extraTitles) {
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
	const records = def.characters.map((c) => ({
		id: c.id,
		script: def.id,
		character: c.character,
		meaning: c.meaning,
		readings: c.readings,
	}));
	await db.characters.bulkPut(records);
}

export async function seedAllCharacters(): Promise<void> {
	const ids = await fetchManifest();
	await Promise.all(ids.map(seedCharacters));
}
