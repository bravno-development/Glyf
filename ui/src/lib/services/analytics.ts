import { browser } from '$app/environment';
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

export function initPostHog() {
	if (!browser || !POSTHOG_KEY) return;

	posthog.init(POSTHOG_KEY, {
		api_host: 'https://eu.i.posthog.com',
		capture_pageview: true,
		capture_pageleave: true
	});
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
	if (!browser || !POSTHOG_KEY) return;
	posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
	if (!browser || !POSTHOG_KEY) return;
	posthog.identify(userId, traits);
}

export function resetUser() {
	if (!browser || !POSTHOG_KEY) return;
	posthog.reset();
}
