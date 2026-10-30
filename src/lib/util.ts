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
