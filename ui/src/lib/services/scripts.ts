import { db } from './db';

export interface ScriptCharacter {
	id: string;
	character: string;
	meaning: string;
	readings: string[];
}

export interface GridColumn {
	label: string;
	chars: string[];
}

export interface ScriptDefinition {
	id: string;
	language: string;
	name: string;
	description: string;
	icon: string;
	available: boolean;
	totalCharacters: number;
	grid?: { columns: GridColumn[] };
	characters: ScriptCharacter[];
}

const cache = new Map<string, ScriptDefinition>();
let manifestCache: string[] | null = null;

async function fetchManifest(): Promise<string[]> {
	if (manifestCache) return manifestCache;
	const res = await fetch('/scripts/index.json');
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
	const records = def.characters.map(c => ({
		id: c.id,
		script: def.id,
		character: c.character,
		meaning: c.meaning,
		readings: c.readings
	}));
	await db.characters.bulkPut(records);
}

export async function seedAllCharacters(): Promise<void> {
	const ids = await fetchManifest();
	await Promise.all(ids.map(seedCharacters));
}
