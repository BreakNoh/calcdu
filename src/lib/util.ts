export function datePraPlainDate(data: Date) {
	return Temporal.PlainDate.from({
		day: data.getUTCDate(),
		month: data.getUTCMonth() + 1,
		year: data.getUTCFullYear()
	});
}
