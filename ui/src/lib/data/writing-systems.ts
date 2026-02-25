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
		slug: "perso_arabic",
		title: "Perso-Arabic alphabet",
		description: "The Persian alphabet. Read and write Farsi using the Perso-Arabic script.",
		longDescription: "The Perso-Arabic script is written right-to-left and has been used to write Persian for over a thousand years. It builds on the Arabic alphabet with four extra letters unique to Persian (پ، چ، ژ، گ). Most letters change shape depending on their position in a word, and short vowels are usually omitted in everyday text — making it a rewarding system to decode once you know the patterns.",
		picture: "/images/writing-systems/perso_arabic.png",
		stats: [
			{ value: 32, label: "letters" },
			{ value: 3, label: "vowel marks" },
		],
		studyPlan: {
			beginner: { perDay: 5, coreIn: "7 days" },
			intensive: { perDay: 10, coreIn: "4 days" },
			recommended: "beginner",
		},
		approach: {
			title: "A structured approach to the Persian alphabet",
			description: "Seven phases introduce letters in order of usefulness — high-frequency letters first, rare Arabic loanword letters last. Short vowel marks come first so you can read fully vocalised practice text from day one.",
			phases: [
				{
					icon: "ـَ",
					title: "Short vowel marks",
					description: "Learn the three vowel marks (a, e, o) before any letters. Practice text uses them throughout, so you can decode words accurately from the very first phase.",
				},
				{
					icon: "ب",
					title: "Core consonants",
					description: "Five of the most common letters: ب، ک، ن، م، ی. These building blocks appear in hundreds of everyday Persian words.",
				},
				{
					icon: "ا",
					title: "Non-connectors",
					description: "Eight letters that only connect to the right, never to the following letter: ا، آ، و، ر، ز، ژ، د، ذ. Knowing which letters break the join is key to reading fluently.",
				},
				{
					icon: "ع",
					title: "Four-form letters",
					description: "Three letters whose shape changes based on whether they connect on both sides, just one side, or neither: ع، غ، ه. The trickiest shapes in the script.",
				},
				{
					icon: "ف",
					title: "More connectors",
					description: "Five more high-frequency letters: ف، ق، ل، ت، خ. With these done you can read the vast majority of everyday Persian text.",
				},
				{
					icon: "پ",
					title: "Persian-specific letters",
					description: "The four letters unique to Persian — پ، چ، ژ، گ — plus two more common connectors: ج، س، ش. None of these exist in the Arabic alphabet.",
				},
				{
					icon: "ص",
					title: "Arabic loanword letters",
					description: "Six letters borrowed from Arabic that share their sound with a letter you already know: ث، ح، ص، ض، ط، ظ. They appear mainly in Arabic loanwords and formal vocabulary.",
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
