import { compareAsc, DateArg, getYear } from "date-fns";
import { getYearHolidays } from "./feriados.js";

async function discoverCountableHolidays(
    date: DateArg<Date>,
    quantity: number
) {
    let currentYear = getYear(date);
    const sameYearHolidays = await getYearHolidays(currentYear);
    const direction = Math.sign(quantity);

    const countableHolidays = sameYearHolidays.filter(
        ({ date: holiday }) => compareAsc(holiday, date) == direction
    );

    while (countableHolidays.length < Math.abs(quantity)) {
        currentYear += direction;
        countableHolidays.push(...(await getYearHolidays(currentYear)));
    }

    return countableHolidays
        .sort(({ date: a }, { date: b }) => {
            return compareAsc(a, b) * direction;
        })
        .slice(0, Math.abs(quantity));
}

export async function addHolidays(
    date: DateArg<Date>,
    quantity: number
): Promise<Date> {
    const holidays = await discoverCountableHolidays(date, quantity);
    const lastHoliday = holidays.at(holidays.length - 1)?.date;
    return new Date(lastHoliday || date);
}
