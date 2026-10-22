export interface FeriadoBrasilAPI {
	date: string;
	name: string;
	type: string;
}

export async function pegarFeriadosAno(ano: number): Promise<FeriadoBrasilAPI[]> {
	const BRASIL_API_ENDPOINT = `https://brasilapi.com.br/api/feriados/v1/${ano}`;

	const res = await fetch(BRASIL_API_ENDPOINT);

	if (res.status != 200) {
		return [];
	}

	const feriados = (await res.json()) as FeriadoBrasilAPI[];
	// const feriadosOrdenados = feriados.sort(({ date: a }, { date: b }) => a.localeCompare(b));

	return feriados;
}

export async function pegarFeriadosIntervalo(
	deAno: number,
	ateAno: number
): Promise<FeriadoBrasilAPI[]> {
	if (deAno == ateAno) {
		return await pegarFeriadosAno(deAno);
	}

	const feriados = [];
	for (let anos = deAno; anos <= ateAno; anos++) {
		const feriadosAno = await pegarFeriadosAno(anos);

		feriados.push(...feriadosAno);
	}

	return feriados;
}
