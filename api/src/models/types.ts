export interface User {
	id: string;
	email: string;
	createdAt: Date;
}

export interface ReviewState {
	itemId: string;
	itemType: "character" | "sentence";
	script: string;
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: string;
	lastReview: string;
}

export interface SyncPayload {
	script: string;
	reviews: ReviewState[];
	lastSync: string;
}

export interface UserProgress {
	script: string;
	totalCardsLearned: number;
	totalReviews: number;
	streakDays: number;
	lastReviewDate: string;
}

export interface MagicLink {
	id: string;
	userId: string | null;
	email: string;
	token: string;
	code: string;
	expiresAt: Date;
	usedAt: Date | null;
	createdAt: Date;
}

export interface AuthResponse {
	token: string;
	user: User;
}
