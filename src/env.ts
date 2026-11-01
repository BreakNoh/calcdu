import { defineEnvVars } from '@sveltejs/kit/env';

const FALLBACK_URL = 'https://diasuteis.bre.dev.br';

export const variables = defineEnvVars({
	/**
	 * URL canônica do site, sem barra final.
	 * Usada em canonical, Open Graph, sitemap.xml e robots.txt.
	 */
	PUBLIC_SITE_URL: {
		public: true,
		static: true,
		schema: (value) => (value && value.trim() ? value.trim().replace(/\/+$/, '') : FALLBACK_URL)
	}
});
