import { SITE } from '#lib/site.ts';

export const prerender = true;

export function GET() {
	const body = `# Robots — ${SITE.name}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE.url}/sitemap.xml

# Crawlers de busca com IA (permitidos para citação)
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

# Scrapers agressivos (bloqueados)
User-agent: Bytespider
Disallow: /

User-agent: PetalBot
Disallow: /
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
}
