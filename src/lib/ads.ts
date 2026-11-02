export const ADSENSE_CLIENT = 'ca-pub-1547067636561503';

/**
 * IDs dos blocos de anúncio do AdSense.
 *
 * Substitua os valores abaixo pelos IDs reais em
 * AdSense > Anúncios > Por bloco de anúncios. Enquanto estiverem com o
 * placeholder `0000000000`, os blocos não exibem anúncios.
 */
export const ADSENSE_SLOTS = {
	lateralEsquerda: '0000000000',
	lateralDireita: '0000000000',
	mobile: '0000000000',
	conteudo: '0000000000'
} as const;
