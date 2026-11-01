import 'temporal-polyfill/global';
import type { Handle } from '@sveltejs/kit/hooks';

/**
 * Cabeçalhos de segurança e de indexação aplicados a todas as respostas.
 * Uma CSP estrita não é aplicada aqui porque o AdSense injeta scripts
 * de terceiros e exigiria testes dedicados antes de entrar em produção.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

	return response;
};
