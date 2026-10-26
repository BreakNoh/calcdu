import { pegarFeriadosIntervalo, type FeriadoBrasilAPI } from './feriados';

export type ContagemDias = {
	total: number;
	du: number;
	fds: number;
	segunda: number;
	terca: number;
	quarta: number;
	quinta: number;
	sexta: number;
	sabado: number;
	domingo: number;
};

export type ContagemFeriados = {
	total: number;
	unicos: number;
	caiEmDiaUtil: number;
};

export function contarDias(deData: Temporal.PlainDate, ateData: Temporal.PlainDate): ContagemDias {
	let dataAtual = deData;
	let contagem = {
		total: 0,
		du: 0,
		fds: 0,
		segunda: 0,
		terca: 0,
		quarta: 0,
		quinta: 0,
		sexta: 0,
		sabado: 0,
		domingo: 0
	};

	while (Temporal.PlainDate.compare(dataAtual, ateData) < 1) {
		contagem.total++;
		switch (dataAtual.dayOfWeek) {
			case 1:
				contagem.segunda++;
				break;
			case 2:
				contagem.terca++;
				break;
			case 3:
				contagem.quarta++;
				break;
			case 4:
				contagem.quinta++;
				break;
			case 5:
				contagem.sexta++;
				break;
			case 6:
				contagem.sabado++;
				break;
			case 7:
				contagem.domingo++;
				break;
		}

		dataAtual = dataAtual.add({ days: 1 });
	}

	contagem.du =
		contagem.segunda + contagem.terca + contagem.quarta + contagem.quinta + contagem.sexta;
	contagem.fds = contagem.sabado + contagem.domingo;

	return contagem;
}

export async function contarFeriados(
	deData: Temporal.PlainDate,
	ateData: Temporal.PlainDate
): Promise<ContagemFeriados> {
	const feriados: FeriadoBrasilAPI[] = await pegarFeriadosIntervalo(deData.year, ateData.year);

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
		unicos: diasUnicos,
		caiEmDiaUtil: caiEmDiaUtil
	};
}
