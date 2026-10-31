export function datePraPlainDate(data: Date) {
	return Temporal.PlainDate.from({
		day: data.getDate(),
		month: data.getMonth() + 1,
		year: data.getFullYear()
	});
}

export function plainDatePraDate(data: Temporal.PlainDate) {
	return new Date(data.year, data.month - 1, data.day);
}

export async function copiarTexto(texto: string) {
	try {
		await navigator.clipboard.writeText(texto);
	} catch {
		const area = document.createElement('textarea');
		area.value = texto;
		area.style.position = 'fixed';
		area.style.opacity = '0';
		document.body.appendChild(area);
		area.select();
		document.execCommand('copy');
		area.remove();
	}
}
