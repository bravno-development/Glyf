/**
 * Static list of writing systems for the public /writing-systems section.
 * Used for SSG list and detail pages; no dynamic data.
 */

export interface StudyPace {
	perDay: number;
	coreIn: string;
}

export interface Lesson {
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
		lessons: Lesson[];
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
			lessons: [
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
			lessons: [
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
	// {
	// 	slug: "arabic",
	// 	title: "Arabic",
	// 	description: "Arabic script used for Arabic, Persian, Urdu and more.",
	// 	longDescription: "Arabic is written right-to-left and uses 28 letters, each with up to four positional forms. Mastering the letter shapes unlocks reading in Arabic, Persian, Urdu and Pashto.",
	// 	stats: [{ value: 28, label: "letters" }, { value: 4, label: "letter forms" }],
	// 	studyPlan: { beginner: { perDay: 5, coreIn: "6 days" }, intensive: { perDay: 10, coreIn: "3 days" }, recommended: "intensive" },
	// 	approach: { title: "A structured approach to Arabic script", description: "Learn the base shapes first, then master the four positional forms in context.", lessons: [{ icon: "ب", title: "Base shapes", description: "Group letters by their core shape. Far fewer patterns than the alphabet suggests." }, { icon: "بيت", title: "Positional forms", description: "See how each letter transforms at the start, middle and end of a word." }] },
	// },
	// {
	// 	slug: "thai",
	// 	title: "Thai",
	// 	description: "The Thai alphabet. Master consonants, vowels and tone marks.",
	// 	longDescription: "Thai script has 44 consonants, 15 vowel symbols and 4 tone marks. The system is phonetic once you internalise the consonant classes and vowel positions.",
	// 	stats: [{ value: 44, label: "consonants" }, { value: 15, label: "vowel symbols" }],
	// 	studyPlan: { beginner: { perDay: 5, coreIn: "9 days" }, intensive: { perDay: 10, coreIn: "5 days" }, recommended: "beginner" },
	// 	approach: { title: "A class-based approach to Thai script", description: "Grouping consonants by class makes the tone system logical instead of arbitrary.", lessons: [{ icon: "ก", title: "Consonant classes", description: "44 consonants fall into three tone classes. Learn the classes and the tone rules follow." }, { icon: "สระ", title: "Vowels & tone marks", description: "Vowels wrap around consonants above, below, before and after. Practice with common words." }] },
	// },
	// {
	// 	slug: "devanagari",
	// 	title: "Devanagari",
	// 	description: "Script for Hindi, Sanskrit, Marathi and other Indian languages.",
	// 	longDescription: "Devanagari is an abugida — each consonant carries an inherent 'a' vowel, modified by diacritics. It is used for Hindi, Sanskrit, Marathi, Nepali and dozens of other languages.",
	// 	stats: [{ value: 36, label: "consonants" }, { value: 13, label: "vowels" }],
	// 	studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" },
	// 	approach: { title: "A systematic approach to Devanagari", description: "Start with the vowels and the inherent 'a', then build out with consonant clusters.", lessons: [{ icon: "अ", title: "Vowels & inherent 'a'", description: "Every Devanagari consonant has a built-in short 'a'. Learn to suppress it with the virama." }, { icon: "क", title: "Core consonants", description: "36 core consonants organised by place of articulation — learn the rows and the sounds come naturally." }] },
	// },
	// { slug: "bengali", title: "Bengali", description: "Bengali script for Bengali and Assamese.", longDescription: "Bengali script is an abugida with 50 letters. It is used for Bengali, the world's 7th most spoken language, as well as Assamese.", stats: [{ value: 50, label: "letters" }], studyPlan: { beginner: { perDay: 6, coreIn: "8 days" }, intensive: { perDay: 12, coreIn: "4 days" }, recommended: "intensive" }, approach: { title: "A step-by-step approach to Bengali script", description: "Master the basic vowels and consonants first, then tackle the conjuncts.", lessons: [{ icon: "অ", title: "Basic letters", description: "50 base letters with clear shapes and predictable sounds." }, { icon: "ক্ষ", title: "Conjuncts", description: "Frequently used consonant clusters that form distinct ligatures." }] } },
	// { slug: "tamil", title: "Tamil", description: "Tamil script. Learn the letters and their sounds.", longDescription: "Tamil script has 12 vowels, 18 consonants and 1 special character, combining into 247 characters in total. Its geometric beauty and phonetic regularity make it very learnable.", stats: [{ value: 12, label: "vowels" }, { value: 18, label: "consonants" }], studyPlan: { beginner: { perDay: 6, coreIn: "5 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A grid-based approach to Tamil", description: "Tamil's vowel-consonant grid is highly regular. Learn the grid and you unlock hundreds of characters at once.", lessons: [{ icon: "அ", title: "The 12 vowels", description: "Tamil vowels form the top row of the grid. Master these first." }, { icon: "க", title: "Consonant-vowel combos", description: "Each consonant combines with each vowel in a predictable pattern." }] } },
	// { slug: "telugu", title: "Telugu", description: "Telugu script used for the Telugu language.", longDescription: "Telugu script is an abugida of Brahmic origin. It has rounded letter shapes and a highly regular vowel-consonant grid, shared in structure with Kannada.", stats: [{ value: 16, label: "vowels" }, { value: 36, label: "consonants" }], studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A systematic approach to Telugu script", description: "The rounded shapes become recognisable quickly once you learn the base forms.", lessons: [{ icon: "అ", title: "Base vowels", description: "16 vowels that form the backbone of the system." }, { icon: "క", title: "Consonants & matras", description: "36 consonants combined with vowel diacritics (matras) for full coverage." }] } },
	// { slug: "gujarati", title: "Gujarati", description: "Gujarati script. Build reading and writing skills.", longDescription: "Gujarati script is derived from Devanagari but has no horizontal top bar. It is used for Gujarati, spoken by over 55 million people.", stats: [{ value: 13, label: "vowels" }, { value: 34, label: "consonants" }], studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A Devanagari-adjacent approach to Gujarati", description: "If you know Devanagari, Gujarati shares the same logic — just different shapes.", lessons: [{ icon: "અ", title: "Vowels & inherent 'a'", description: "13 vowels and the same inherent-a pattern as Devanagari." }, { icon: "ક", title: "Consonants", description: "34 consonants with recognisable Brahmic patterns." }] } },
	// { slug: "gurmukhi", title: "Gurmukhi", description: "Gurmukhi script for Punjabi.", longDescription: "Gurmukhi was standardised in the 16th century for the Punjabi language. It has 35 consonants arranged in a traditional phonetic grid.", stats: [{ value: 35, label: "consonants" }, { value: 10, label: "vowel diacritics" }], studyPlan: { beginner: { perDay: 5, coreIn: "7 days" }, intensive: { perDay: 10, coreIn: "4 days" }, recommended: "intensive" }, approach: { title: "A phonetic approach to Gurmukhi", description: "Letters are organised by how they are pronounced — learn the categories and the sounds fall into place.", lessons: [{ icon: "ਅ", title: "Vowel carriers & diacritics", description: "Three vowel carriers plus 10 diacritics cover all Punjabi vowels." }, { icon: "ਕ", title: "35 consonants", description: "Arranged in a classic Brahmic grid — rows share the same place of articulation." }] } },
	// { slug: "kannada", title: "Kannada", description: "Kannada script. Master the characters systematically.", longDescription: "Kannada script is an abugida closely related to Telugu. It has 49 base letters and a highly regular vowel-consonant matrix.", stats: [{ value: 16, label: "vowels" }, { value: 34, label: "consonants" }], studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A matrix-based approach to Kannada", description: "Kannada's grid makes each new consonant unlock 16 new syllables instantly.", lessons: [{ icon: "ಅ", title: "Vowels & matras", description: "16 independent vowels and their diacritic forms." }, { icon: "ಕ", title: "Core consonants", description: "34 consonants, each combining with the vowel matras in the grid." }] } },
	// { slug: "malayalam", title: "Malayalam", description: "Malayalam script for the Malayalam language.", longDescription: "Malayalam script has one of the largest character inventories of any alphabet, with over 500 characters when conjuncts are included. Start with the 53 base letters.", stats: [{ value: 15, label: "vowels" }, { value: 38, label: "consonants" }], studyPlan: { beginner: { perDay: 5, coreIn: "11 days" }, intensive: { perDay: 10, coreIn: "6 days" }, recommended: "beginner" }, approach: { title: "A phased approach to Malayalam", description: "Focus on the 53 base characters first — the conjuncts come naturally with reading practice.", lessons: [{ icon: "അ", title: "Base vowels", description: "15 vowels with clear shapes and consistent sounds." }, { icon: "ക", title: "Core consonants", description: "38 consonants. Learn the most frequent ones first for fast reading gains." }] } },
	// { slug: "burmese", title: "Burmese", description: "Burmese script. Learn the rounded letters and diacritics.", longDescription: "Burmese script is an abugida with circular letter shapes. It has 33 consonants and 8 vowel diacritics. The roundness of its letters comes from being written on palm leaves.", stats: [{ value: 33, label: "consonants" }, { value: 8, label: "vowel diacritics" }], studyPlan: { beginner: { perDay: 5, coreIn: "7 days" }, intensive: { perDay: 10, coreIn: "4 days" }, recommended: "intensive" }, approach: { title: "A shape-focused approach to Burmese", description: "Group consonants by their visual similarity. The circular shapes become distinct once you know what to look for.", lessons: [{ icon: "က", title: "Core consonants", description: "33 consonants in circular forms. Start with the most frequent." }, { icon: "ာ", title: "Vowel diacritics", description: "8 diacritics attached above, below or around consonants to change the vowel sound." }] } },
	// { slug: "khmer", title: "Khmer", description: "Khmer script for the Cambodian language.", longDescription: "Khmer is the script of the Cambodian language and one of the oldest scripts in Southeast Asia. It has two series of consonants (aspirated and unaspirated) and a wide variety of vowel diacritics.", stats: [{ value: 33, label: "consonants" }, { value: 23, label: "vowel symbols" }], studyPlan: { beginner: { perDay: 5, coreIn: "7 days" }, intensive: { perDay: 10, coreIn: "4 days" }, recommended: "beginner" }, approach: { title: "A series-based approach to Khmer", description: "Two consonant series (a-series and o-series) each shift vowel sounds. Learn one series at a time.", lessons: [{ icon: "ក", title: "A-series consonants", description: "The first set of 15 consonants. Each pairs with its vowel diacritics." }, { icon: "ខ", title: "O-series & vowel diacritics", description: "The second set plus the 23 vowel diacritics that sit above, below, before and after consonants." }] } },
	// { slug: "hebrew", title: "Hebrew", description: "Hebrew alphabet. Read right-to-left with confidence.", longDescription: "Hebrew uses a 22-letter alphabet written right-to-left. Letters represent only consonants; vowel marks (niqqud) are optional and usually omitted in everyday text.", stats: [{ value: 22, label: "letters" }, { value: 5, label: "final forms" }], studyPlan: { beginner: { perDay: 5, coreIn: "5 days" }, intensive: { perDay: 11, coreIn: "2 days" }, recommended: "intensive" }, approach: { title: "A consonant-first approach to Hebrew", description: "Master the 22 letter shapes, then tackle the 5 final forms and optional vowel marks.", lessons: [{ icon: "א", title: "22 consonants", description: "Learn the block-script forms used in print. Right-to-left direction becomes second nature quickly." }, { icon: "כ", title: "Final forms", description: "5 letters change shape at the end of a word. Learn them as pairs with their standard forms." }] } },
	// {
	// 	slug: "cyrillic",
	// 	title: "Cyrillic",
	// 	description: "Cyrillic script used for Russian, Ukrainian and more.",
	// 	longDescription: "The Cyrillic alphabet was created in the 9th century and is used for over 50 languages including Russian, Ukrainian, Serbian and Bulgarian. Many letters are shared with or similar to Latin.",
	// 	stats: [{ value: 33, label: "letters (Russian)" }, { value: 11, label: "familiar shapes" }],
	// 	studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 11, coreIn: "3 days" }, recommended: "intensive" },
	// 	approach: { title: "A familiar-to-unfamiliar approach to Cyrillic", description: "Many Cyrillic letters look like Latin or Greek — start with those and the rest feel much less foreign.", lessons: [{ icon: "А", title: "Familiar letters first", description: "11 letters are identical or near-identical to Latin. An instant head start." }, { icon: "Ж", title: "Unique Cyrillic shapes", description: "22 remaining letters with no Latin equivalent — learned in small groups by shape similarity." }] },
	// },
	// { slug: "armenian", title: "Armenian", description: "Armenian alphabet. Distinct letter shapes and sounds.", longDescription: "The Armenian alphabet was created in 405 AD and has been in continuous use since. Its 38 letters are unique to Armenian and highly regular in their sound–letter correspondence.", stats: [{ value: 38, label: "letters" }], studyPlan: { beginner: { perDay: 6, coreIn: "7 days" }, intensive: { perDay: 12, coreIn: "4 days" }, recommended: "intensive" }, approach: { title: "A systematic approach to the Armenian alphabet", description: "38 completely unique letters with consistent sounds. Regular study sessions make steady progress.", lessons: [{ icon: "Ա", title: "Core letters", description: "Start with the 38 base letters. Many sounds map directly to English phonemes." }, { icon: "Ու", title: "Combinations", description: "A few common two-letter combinations that behave as single sounds." }] } },
	// { slug: "mkhedruli", title: "Mkhedruli", description: "Georgian Mkhedruli script for modern Georgian.", longDescription: "Mkhedruli is the modern Georgian script with 33 letters. It has no upper or lower case and its flowing shapes are unlike any other writing system.", stats: [{ value: 33, label: "letters" }], studyPlan: { beginner: { perDay: 5, coreIn: "7 days" }, intensive: { perDay: 11, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A shape-cluster approach to Mkhedruli", description: "Group letters by their visual features — loops, ascenders and descenders — to build recognition systematically.", lessons: [{ icon: "ა", title: "Loop letters", description: "Many Mkhedruli letters feature a distinctive loop. Learn these as a group first." }, { icon: "ბ", title: "Stroke letters", description: "Letters with simpler stroke-based forms. Complete the alphabet after mastering the loops." }] } },
	// { slug: "geez", title: "Geʽez", description: "Geʽez script for Amharic, Tigrinya and related languages.", longDescription: "Geʽez is a syllabic script with 34 base characters, each with 7 vowel-modified forms — giving 238 syllables in total. It is used for Amharic, Ethiopia's most widely spoken language.", stats: [{ value: 34, label: "base characters" }, { value: 7, label: "vowel forms each" }], studyPlan: { beginner: { perDay: 6, coreIn: "6 days" }, intensive: { perDay: 12, coreIn: "3 days" }, recommended: "intensive" }, approach: { title: "A column-based approach to Geʽez", description: "Each base character has 7 forms. Learn the base shape and the vowel modifications fall into a pattern.", lessons: [{ icon: "ሀ", title: "First order characters", description: "34 base forms — one per consonant. Build visual recognition here first." }, { icon: "ሃ", title: "Six vowel modifications", description: "Each base adds a small stroke or hook to mark the vowel. Learn the modification patterns, not 238 individual shapes." }] } },
	// { slug: "cherokee", title: "Cherokee", description: "Cherokee syllabary. Learn the 85 characters.", longDescription: "The Cherokee syllabary was invented by Sequoyah in 1820. Its 85 characters each represent a consonant-vowel syllable, and it can be learned to full reading ability in a few weeks.", stats: [{ value: 85, label: "syllables" }, { value: 6, label: "vowel sounds" }], studyPlan: { beginner: { perDay: 6, coreIn: "14 days" }, intensive: { perDay: 12, coreIn: "7 days" }, recommended: "intensive" }, approach: { title: "A vowel-row approach to Cherokee", description: "The syllabary is organised by consonant columns and vowel rows. Mastering one row unlocks all six vowel forms for that consonant.", lessons: [{ icon: "Ꭰ", title: "Vowel rows", description: "Six vowel sounds (a, e, i, o, u, v). Start with the 'a' row across all consonants." }, { icon: "Ꭷ", title: "Consonant columns", description: "Work through consonant columns systematically to complete the syllabary." }] } },
];

const slugToScript = new Map(writingSystems.map((s) => [s.slug, s]));

export function getWritingSystemBySlug(slug: string): WritingSystem | undefined {
	return slugToScript.get(slug);
}

export function getAllWritingSystemSlugs(): string[] {
	return writingSystems.map((s) => s.slug);
}
