import {
	contarDiasCorridos,
	contarDiasUteis,
	contarFeriados,
	contarFinaisDeSemana
} from '#lib/contagem.js';
import { pegarFeriadosIntervalo } from '#lib/feriados.js';
import { utc } from '@date-fns/utc';
import { type RequestHandler } from '@sveltejs/kit';
import { differenceInCalendarDays } from 'date-fns';
import z from 'zod';

const schemaDatas = z
	.object({
		d: z.coerce.date(),
		a: z.coerce.date()
	})
	.refine(({ d, a }) => {
		return differenceInCalendarDays(a, d, { in: utc }) >= 0;
	})
	.transform(({ d, a }) => ({
		deData: d,
		ateData: a
	}));

export const GET: RequestHandler = async ({ url }) => {
	const parametros = Object.fromEntries(url.searchParams.entries().toArray());
	const parse = schemaDatas.safeParse(parametros);

	if (!parse.success) {
		return new Response(null, { status: 400 });
	}

	const { deData, ateData } = parse.data;

	const diasCorridos = contarDiasCorridos(deData, ateData);
	const feriados = await pegarFeriadosIntervalo(deData.getUTCFullYear(), ateData.getUTCFullYear());
	const diasUteis = contarDiasUteis(deData, ateData, feriados);
	const diasFeriados = contarFeriados(deData, ateData, feriados);
	const finsSemana = contarFinaisDeSemana(deData, ateData);

	const resultado = {
		corridos: diasCorridos,
		uteis: diasUteis,
		feriados: diasFeriados.diasUnicos,
		finaisDeSemana: finsSemana.total
	};

	return new Response(JSON.stringify(resultado), {
		headers: { 'Content-Type': 'application/json' }
	});
};
