import { PUBLIC_SITE_URL } from '$app/env/public';

/**
 * Configuração canônica do site.
 *
 * A URL vem de PUBLIC_SITE_URL (definida em src/env.ts). Quando a variável
 * não existe no ambiente de build, o fallback aponta para o deploy da Vercel.
 */
export const SITE = {
	url: PUBLIC_SITE_URL,
	name: 'Calcdu',
	title: 'Calculadora de Datas — Dias Úteis e Feriados',
	shortTitle: 'Calculadora de datas',
	description:
		'Calcule dias corridos, dias úteis, fins de semana e feriados entre duas datas. Veja o resumo do período e planeje prazos de forma simples e gratuita.',
	locale: 'pt_BR',
	language: 'pt-BR',
	author: 'Breno Meneses',
	authorUrl: 'https://bre.dev.br',
	repoUrl: 'https://github.com/breaknoh/calcdu',
	updatedAt: '2026-11-01'
} as const;

export function absoluteUrl(path = '/') {
	return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`;
}
