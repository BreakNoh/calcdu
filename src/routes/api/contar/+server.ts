import { contarDias, contarFeriados } from '#lib/contagem.js';
import { datePraPlainDate } from '#lib/util.js';
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
	const de = datePraPlainDate(deData);
	const ate = datePraPlainDate(ateData);

	const contagem = contarDias(de, ate);
	const feriados = await contarFeriados(de, ate);

	const resultado = {
		corridos: contagem.total,
		uteis: contagem.du - feriados.caiEmDiaUtil,
		feriados: feriados.unicos,
		finaisDeSemana: contagem.fds
	};

	return new Response(JSON.stringify(resultado), {
		headers: { 'Content-Type': 'application/json' }
	});
};
