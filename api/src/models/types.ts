export interface User {
	id: string;
	email: string;
	createdAt: Date;
	reminderEnabled?: boolean;
	reminderTimeLocal?: string; // "HH:mm"
	timezone?: string;
	nextReminderAt?: string; // ISO
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
	totalGlyphsLearned: number;
	totalScriptsLearned: number;
	totalReviews: number;
	streakDays: number;
	dailyGoal: number;
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

// Progress tracker (character-only)
export interface AttemptItem {
	itemId: string;
	script: string;
	stepType: string;
	correct: boolean;
	responseTimeMs: number;
	uuidLocal: string;
	userResponse?: string;
	correctAnswer?: string;
}

export interface SubmitAttemptsPayload {
	sessionId: string;
	attempts: AttemptItem[];
}

export interface SubmitAttemptsResponse {
	success: boolean;
	accepted: number;
}

export interface DueItem {
	itemId: string;
	nextReviewAt: string;
}

export type NotificationType = "email" | "in_app";

export interface Notification {
	id: string;
	type: NotificationType;
	createdAt: string; // ISO
	readAt: string | null; // ISO
}
