import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			$lib: '/home/user/Glyf/ui/src/lib'
		}
	},
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		globals: true
	}
});
