import { error } from '@sveltejs/kit';
import { getWritingSystemBySlug, getAllWritingSystemSlugs } from '$lib/data/writing-systems';

export const prerender = true;

export function entries() {
	return getAllWritingSystemSlugs().map((slug) => ({ slug }));
}

export function load({ params }) {
	const script = getWritingSystemBySlug(params.slug);
	if (!script) {
		throw error(404, `Writing system not found: ${params.slug}`);
	}
	return { script };
}
