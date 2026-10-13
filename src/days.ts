import {
    addBusinessDays,
    addDays,
    addMonths,
    addWeeks,
    addYears,
    compareAsc,
    DateArg,
    differenceInBusinessDays,
    differenceInCalendarDays,
    getDay,
    getYear,
    isWeekend,
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

export function addWeekends(
    date: DateArg<Date>,
    quantity: number
): Date {
    let currentDate = new Date(date);
    if (isNaN(currentDate.getTime())) {
        return new Date(NaN);
    }

    const amount = Math.trunc(quantity);
    if (isNaN(amount) || amount === 0) {
        return currentDate;
    }

    const step = Math.sign(amount);
    let remaining = Math.abs(amount);

    while (remaining > 0) {
        currentDate = addDays(currentDate, step);
        if (isWeekend(currentDate)) {
            remaining -= 1;
        }
    }

    return currentDate;
}

export type TimeUnit = "w" | "d" | "b" | "h" | "m" | "y" | "f";

export async function addToDate(
    refDate: Date,
    quantity: number,
    unity: TimeUnit
): Promise<Date | null> {
    switch (unity) {
        case "y":
            return addYears(refDate, quantity);
        case "m":
            return addMonths(refDate, quantity);
        case "w":
            return addWeeks(refDate, quantity);
        case "d":
            return addDays(refDate, quantity);
        case "b":
            return addBusinessDays(refDate, quantity);
        case "h":
            return await addHolidays(refDate, quantity);
        case "f":
            return addWeekends(refDate, quantity);
        default:
            return null;
    }
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

export function getWeekends(fromDate: Date, toDate: Date) {
    const days = differenceInCalendarDays(toDate, fromDate);
    const rawBusinessDays = differenceInBusinessDays(toDate, fromDate);
    return days - rawBusinessDays;
}

export async function getHolidays(fromDate: Date, toDate: Date) {
    return await getHolidaysBetweenDates(fromDate, toDate);
}

export async function getInterval(fromDate: Date, toDate: Date) {
    const days = differenceInCalendarDays(toDate, fromDate);
    const rawBusinessDays = differenceInBusinessDays(toDate, fromDate);
    const weekends = days - rawBusinessDays;
    const { businessDays, holidays } = await getBusinessDays(fromDate, toDate);

    return {
        days,
        businessdays: Math.max(0, businessDays),
        weekends,
        holidays: holidays.length,
    };
}
