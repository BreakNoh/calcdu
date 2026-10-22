import { type FeriadoBrasilAPI } from './feriados';

export function contarDiasCorridos(deData: Temporal.PlainDate, ateData: Temporal.PlainDate) {
	return deData.until(ateData).total('days');
}

export function contarFinaisDeSemana(deData: Temporal.PlainDate, ateData: Temporal.PlainDate) {
	const diasCorridos = contarDiasCorridos(deData, ateData);

	if (diasCorridos <= 0) {
		return { sabados: 0, domingos: 0, total: 0 };
	}

	const diaDaSemanaInicial = deData.day;
	const semanasCompletas = Math.floor(diasCorridos / 7);
	let sabados = semanasCompletas;
	let domingos = semanasCompletas;

	const diasRestantes = diasCorridos % 7;

	for (let i = 0; i < diasRestantes; i++) {
		const diaAtual = (diaDaSemanaInicial + i) % 7;

		if (diaAtual === 6) {
			sabados++;
		} else if (diaAtual === 0) {
			domingos++;
		}
	}

	return {
		sabados,
		domingos,
		total: sabados + domingos
	};
}

export function contarFeriados(
	deData: Temporal.PlainDate,
	ateData: Temporal.PlainDate,
	feriados: FeriadoBrasilAPI[]
) {
	const feriadosEntreDatas = feriados.filter(({ date }) => {
		return (
			Temporal.PlainDate.compare(date, deData) >= 0 &&
			Temporal.PlainDate.compare(date, ateData) <= 0
		);
	});

	const feriadosContaveis = feriadosEntreDatas.filter(({ date }) => {
		const dia = Temporal.PlainDate.from(date).day;
		return dia !== 0 && dia !== 6;
	});

	const diasUnicos = new Set(feriadosEntreDatas.map(({ date }) => date)).size;
	const caiEmDiaUtil = new Set(feriadosContaveis.map(({ date }) => date)).size;

	return {
		total: feriadosEntreDatas.length,
		diasUnicos,
		caiEmDiaUtil
	};
}

export function contarDiasUteis(
	deData: Temporal.PlainDate,
	ateData: Temporal.PlainDate,
	feriados: FeriadoBrasilAPI[]
): number {
	const diasCorridos = contarDiasCorridos(deData, ateData);

	if (diasCorridos <= 0) {
		return 0;
	}

	const finaisDeSemana = contarFinaisDeSemana(deData, ateData);
	const feriadosContados = contarFeriados(deData, ateData, feriados);

	const diasUteis = diasCorridos - finaisDeSemana.total - feriadosContados.caiEmDiaUtil;

	return Math.max(0, diasUteis);
}
