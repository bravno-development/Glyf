/**
 * Static list of writing systems for the public /writing-systems section.
 * Used for SSG list and detail pages; no dynamic data.
 */

export interface StudyPace {
	perDay: number;
	coreIn: string;
}

export interface Phase {
	icon: string;
	title: string;
	description: string;
}

export interface WritingSystem {
	slug: string;
	title: string;
	description: string;
	longDescription: string;
	picture: string;
	stats: { value: number; label: string }[];
	studyPlan: {
		beginner: StudyPace;
		intensive: StudyPace;
		recommended: 'beginner' | 'intensive';
	};
	approach: {
		title: string;
		description: string;
		phases: Phase[];
	};
}

export const writingSystems: WritingSystem[] = [
	{
		slug: "hangul",
		title: "Hangul",
		description: "The Korean alphabet. Learn consonants and vowels with spaced repetition.",
		longDescription: "Hangul was created in 1443 by King Sejong and is considered one of the most systematic writing systems ever devised. Its 24 basic letters combine into syllable blocks, making it possible to learn to read Korean in just a few days.",
		picture: "/images/writing-systems/hangul.png",
		stats: [
			{ value: 24, label: "letters" },
			{ value: 27, label: "syllable combos" },
		],
		studyPlan: {
			beginner: { perDay: 6, coreIn: "4 days" },
			intensive: { perDay: 12, coreIn: "2 days" },
			recommended: "intensive",
		},
		approach: {
			title: "A systematic approach to the Korean alphabet",
			description: "Each stage uses spaced repetition & active recall, building on what you already know so nothing feels overwhelming.",
			phases: [
				{
					icon: "ㄱ",
					title: "Consonants first",
					description: "Start with the 14 basic consonants — simple strokes with predictable sounds. Build visual recognition before adding vowels.",
				},
				{
					icon: "아",
					title: "Vowels & syllable blocks",
					description: "Learn the 10 basic vowels and how letters stack into syllable blocks. Unlock reading once you see how the grid works.",
				},
			],
		},
	},
	{
		slug: "greek",
		title: "Greek alphabet",
		description: "The Greek alphabet. Foundation for Modern and Ancient Greek.",
		longDescription: "The Greek alphabet has been in continuous use since around 750 BC, making it one of the oldest writing systems still in everyday use. Internalise the 24 letters through active recall & master common diphthongs to unlock reading modern Greek text.",
		picture: "/images/writing-systems/greek.png",
		stats: [
			{ value: 24, label: "letters" },
			{ value: 6, label: "diphthongs" },
		],
		studyPlan: {
			beginner: { perDay: 6, coreIn: "4 days" },
			intensive: { perDay: 12, coreIn: "2 days" },
			recommended: "intensive",
		},
		approach: {
			title: "A science-based approach to the Greek alphabet",
			description: "Each stage uses spaced repetition & active recall, building on what you already know so nothing feels overwhelming.",
			phases: [
				{
					icon: "Α",
					title: "Core letters first",
					description: "Start with the 24 basic Greek letters — familiar shapes first (A, B, E, K, M, T...), then the unfamiliar ones. All 24 from Alpha to Omega.",
				},
				{
					icon: "αι",
					title: "Diphthongs & combos",
					description: "Six two-letter combinations (αι, ει, οι, αυ, ευ, ου) that produce single sounds. This is where real reading fluency begins.",
				},
			],
		},
	},
];

const slugToScript = new Map(writingSystems.map((s) => [s.slug, s]));

export function getWritingSystemBySlug(slug: string): WritingSystem | undefined {
	return slugToScript.get(slug);
}

export function getAllWritingSystemSlugs(): string[] {
	return writingSystems.map((s) => s.slug);
}
