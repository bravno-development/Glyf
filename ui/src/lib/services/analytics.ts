import { browser } from '$app/environment';
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;

export function initPostHog() {
	if (!browser || !POSTHOG_KEY) return;

	posthog.init(POSTHOG_KEY, {
		api_host: 'https://eu.i.posthog.com',
		capture_pageview: true,
		capture_pageleave: true,
		opt_out_capturing_by_default: true
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

export function acceptTracking() {
	if (!browser || !POSTHOG_KEY) return;
	posthog.opt_in_capturing();
}

export function declineTracking() {
	if (!browser || !POSTHOG_KEY) return;
	posthog.opt_out_capturing();
}

export function hasConsentDecision(): boolean {
	if (!browser || !POSTHOG_KEY) return false;
	// PostHog stores explicit consent as `__ph_opt_in_out_<token>` in localStorage.
	// With opt_out_capturing_by_default, has_opted_out_capturing() returns true even
	// before the user acts — so we check the key directly instead.
	return localStorage.getItem(`__ph_opt_in_out_${POSTHOG_KEY}`) !== null;
}
