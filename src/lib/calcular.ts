import { pegarFeriadosAno } from './feriados';

export function adicionarDiasCorridos(dataInicial: Temporal.PlainDate, dias: number) {
	return dataInicial.add({ days: dias });
}

export async function adicionarFeriados(dataInicial: Temporal.PlainDate, dias: number) {
	if (dias == 0) {
		return dataInicial;
	}

	let proximoAno = dataInicial.year;
	const feriados = await pegarFeriadosAno(dataInicial.year);

	const feriadosContados = feriados.filter(({ date }) => {
		return Temporal.PlainDate.compare(date, dataInicial) >= 0;
	});

	while (feriadosContados.length < dias) {
		const feriadosProximoAno = await pegarFeriadosAno(proximoAno);

		feriadosContados.push(...feriadosProximoAno);

		if (feriadosContados.length >= dias) {
			break;
		}

		proximoAno += 1;
	}

	return feriadosContados[dias - 1];
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
