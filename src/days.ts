import {
    compareAsc,
    DateArg,
    differenceInBusinessDays,
    differenceInCalendarDays,
    getDay,
    getYear,
} from "date-fns";
import { getHolidaysBetweenDates, getYearHolidays } from "./feriados.js";

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

export function getCalendarDays(fromDate: Date, toDate: Date) {
    const days = differenceInCalendarDays(toDate, fromDate);
    return { days };
}

export async function getBusinessDays(fromDate: Date, toDate: Date) {
    const businessDays = differenceInBusinessDays(toDate, fromDate);
    const holidays = await getHolidaysBetweenDates(fromDate, toDate);
    const countedHolidays = new Set<string>();
    let countedDays = businessDays;

    holidays.forEach(({ date }) => {
        const weekday = getDay(date);
        const SUNDAY = 0;
        const SATURDAY = 6;

        if (
            ![SUNDAY, SATURDAY].includes(weekday) &&
            !countedHolidays.has(date)
        ) {
            countedHolidays.add(date);
            countedDays -= 1;
        }
    });

    return {
        businessDays: countedDays,
        holidays: holidays.map(({ date, name }) => ({ date, name })),
    };
}

export async function getHolidays(fromDate: Date, toDate: Date) {
    return await getHolidaysBetweenDates(fromDate, toDate);
}
