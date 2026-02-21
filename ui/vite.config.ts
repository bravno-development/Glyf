import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	server: {
		allowedHosts: ["glyf.bravno.com"],
	},
	build: {
		minify: "esbuild",
		sourcemap: false,
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Glyf",
				short_name: "Glyf",
				description: "Learn writing systems with spaced repetition",
				theme_color: "#2A5A3A",
				background_color: "#ffffff",
				display: "standalone",
				start_url: "/",
				icons: [
					{
						src: "/favicon/glyf_icon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "any",
					},
					{
						src: "/favicon/glyf_icon.svg",
						sizes: "any",
						type: "image/svg+xml",
						purpose: "maskable",
					},
				],
			},
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
				navigateFallback: "/index.html",
				navigateFallbackDenylist: [/^\/api\//],
				clientsClaim: true,
				skipWaiting: true,
				cleanupOutdatedCaches: true,
			},
		}),
	],
});
