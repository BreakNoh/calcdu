import { SITE } from '#lib/site.ts';

export const prerender = true;

export function GET() {
	const body = `# ${SITE.name}

> Calculadora de datas gratuita em português brasileiro. Conta dias corridos, dias úteis, fins de semana e feriados nacionais entre duas datas, com calendário interativo e resumo do período.

## Ferramenta principal

- [Calculadora de Datas](${SITE.url}/): conta o intervalo entre duas datas em dias corridos, dias úteis, fins de semana e feriados nacionais, com opção de travar uma data como referência.
- [Como contar dias entre duas datas](${SITE.url}/#titulo-conteudo): explicação sobre contagem inclusiva, uso do calendário e ajuste do intervalo.
- [Dias corridos e dias úteis](${SITE.url}/#dias-corridos): diferenças entre as duas formas de contagem e exemplos de uso.
- [Feriados no cálculo de dias úteis](${SITE.url}/#feriados): como feriados nacionais fixos e móveis afetam a contagem.
- [Exemplos práticos](${SITE.url}/#exemplos): prazos em dias úteis e corridos com datas de referência.
- [Perguntas frequentes](${SITE.url}/#faq): dúvidas sobre contagem inclusiva, feriados e prazos legais.

## Dados e transparência

- [BrasilAPI](https://brasilapi.com.br): fonte pública da lista de feriados nacionais usada pela ferramenta.
- [Código-fonte](${SITE.repoUrl}): repositório público do projeto.
- [Autor](${SITE.authorUrl}): Breno Meneses.

## Escopo e limitações

- Considera apenas feriados nacionais; feriados estaduais, municipais e pontos facultativos não são descontados.
- A contagem padrão é inclusiva: as datas inicial e final fazem parte do intervalo.
- Não substitui a contagem oficial de prazos processuais ou administrativos.
`;

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
		}
	});
}
