import { pegarFeriadosAno } from './feriados';

export type CampoDias = 'dias' | 'diasUteis' | 'fimDeSemana' | 'feriados';
export type Direcao = 1 | -1;

export function adicionarDiasCorridos(dataInicial: Temporal.PlainDate, dias: number) {
	return dataInicial.add({ days: dias });
}

export async function adicionarFeriados(
	dataInicial: Temporal.PlainDate,
	dias: number,
	direcao: Direcao = 1
): Promise<Temporal.PlainDate> {
	if (dias <= 0) {
		return dataInicial;
	}

	let ano = dataInicial.year;
	const feriados = new Map<string, Temporal.PlainDate>();

	while (true) {
		const feriadosAno = await pegarFeriadosAno(ano);

		for (const { date } of feriadosAno) {
			const feriado = Temporal.PlainDate.from(date);
			const comparacao = Temporal.PlainDate.compare(feriado, dataInicial);

			if (direcao > 0 ? comparacao >= 0 : comparacao <= 0) {
				feriados.set(date, feriado);
			}
		}

		const feriadosOrdenados = [...feriados.values()].sort(
			(a, b) => Temporal.PlainDate.compare(a, b) * direcao
		);

		if (feriadosOrdenados.length >= dias) {
			return feriadosOrdenados[dias - 1];
		}

		ano += direcao;
	}
}

export function adicionarDiasUteis(
	dataInicial: Temporal.PlainDate,
	dias: number
): Temporal.PlainDate {
	if (dias === 0) return dataInicial;

	const sign = Math.sign(dias);
	const absDias = Math.abs(dias);

	// Blocos de semanas inteiras viram 7 dias no calendário cada
	const semanasInteiras = Math.floor(absDias / 5);
	let diasSobra = absDias % 5;

	let diasCalendario = semanasInteiras * 7;

	// Obtém o dia da semana atual (1 = Seg, ..., 5 = Sex, 6 = Sáb, 7 = Dom)
	let dow = dataInicial.dayOfWeek;

	// Se a data inicial for fim de semana, normalizamos para a próxima segunda (se positivo)
	if (dow === 6) {
		dataInicial = dataInicial.add({ days: sign > 0 ? 2 : -1 });
		dow = dataInicial.dayOfWeek;
	} else if (dow === 7) {
		dataInicial = dataInicial.add({ days: sign > 0 ? 1 : -2 });
		dow = dataInicial.dayOfWeek;
	}

	// Lógica para as sobras cruzarem o fim de semana
	if (sign > 0) {
		const diasAteSexta = 5 - dow;
		if (diasSobra > diasAteSexta) {
			diasSobra += 2; // Pula o fim de semana
		}
		diasCalendario += diasSobra;
	} else {
		const diasAteSegunda = dow - 1;
		if (diasSobra > diasAteSegunda) {
			diasSobra += 2; // Pula o fim de semana para trás
		}
		diasCalendario += diasSobra;
	}

	return dataInicial.add({ days: sign * diasCalendario });
}

export async function adicionarDiasUteisComFeriados(
	dataInicial: Temporal.PlainDate,
	dias: number,
	direcao: Direcao = 1
): Promise<Temporal.PlainDate> {
	if (dias <= 0) return dataInicial;

	let data = dataInicial;
	let contados = 0;
	let anoFeriados = dataInicial.year;
	let feriados = new Set((await pegarFeriadosAno(anoFeriados)).map(({ date }) => date));

	while (contados < dias) {
		if (data.year !== anoFeriados) {
			anoFeriados = data.year;
			const feriadosAno = await pegarFeriadosAno(anoFeriados);
			feriados = new Set([...feriados, ...feriadosAno.map(({ date }) => date)]);
		}

		if (data.dayOfWeek <= 5 && !feriados.has(data.toString())) {
			contados += 1;

			if (contados === dias) {
				return data;
			}
		}

		data = data.add({ days: direcao });
	}

	return data;
}

export function adicionarFinaisDeSemana(
	dataInicial: Temporal.PlainDate,
	dias: number,
	direcao: Direcao = 1
): Temporal.PlainDate {
	if (dias <= 0) return dataInicial;

	let data = dataInicial;
	let contados = 0;

	while (true) {
		if (data.dayOfWeek >= 6) {
			contados += 1;

			if (contados === dias) {
				return data;
			}
		}

		data = data.add({ days: direcao });
	}
}
