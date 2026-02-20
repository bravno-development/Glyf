import Dexie, { type Table } from "dexie";

export interface Character {
	id: string;
	script: string;
	character: string;
	meaning: string;
	readings?: string[];
	order?: number;
}

export interface Sentence {
	id: string;
	script: string;
	sentence: string;
	translation: string;
	characters: string[];
	difficulty: number;
}

export interface Review {
	id?: number;
	itemId: string;
	itemType: "character" | "sentence";
	script: string;
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: string;
	lastReview: string;
}

export interface Session {
	id?: number;
	script: string;
	date: string;
	cardsReviewed: number;
	timeSpent: number;
}

export interface SyncState {
	script: string;
	lastSync: string;
	pendingChanges: boolean;
}

export class GlyfDB extends Dexie {
	characters!: Table<Character>;
	sentences!: Table<Sentence>;
	reviews!: Table<Review>;
	sessions!: Table<Session>;
	syncState!: Table<SyncState>;

	constructor() {
		super("GlyfDB");

		this.version(1).stores({
			characters: "id, script",
			sentences: "id, script, difficulty",
			reviews: "++id, itemId, script, [script+nextReview], nextReview",
			sessions: "++id, script, date",
			syncState: "script",
		});
	}
}

export const db = new GlyfDB();
