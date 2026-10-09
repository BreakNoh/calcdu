import { compareAsc } from "date-fns";

interface HolidayBrasilAPI {
    date: string;
    name: string;
    type: string;
}

export async function getYearHolidays(
    year: number
): Promise<HolidayBrasilAPI[]> {
    const BRASIL_API_ENDPOINT = `https://brasilapi.com.br/api/feriados/v1/${year}`;

    const res = await fetch(BRASIL_API_ENDPOINT);

    if (res.status != 200) {
        return [];
    }

    const json = (await res.json()) as HolidayBrasilAPI[];

    return json;
}

export async function getRangeYearHolidays(
    earlierYear: number,
    laterYear: number
): Promise<HolidayBrasilAPI[]> {
    if (earlierYear == laterYear) {
        return await getYearHolidays(earlierYear);
    }

    const holidays = [];
    for (let year = earlierYear; year <= laterYear; year++) {
        const yearHolidays = await getYearHolidays(year);

        holidays.push(...yearHolidays);
    }

    return holidays;
}

export function filterHolidaysBetweenDates(
    earlierDate: Date,
    laterDate: Date,
    holidays: HolidayBrasilAPI[]
): HolidayBrasilAPI[] {
    const filteredHolidays = holidays.filter(({ date }) => {
        // compare de date vem depois de earlierDate e se laterDate vem depois de date
        return (
            compareAsc(date, earlierDate) >= 0 &&
            compareAsc(laterDate, date) >= 0
        );
    });

    return filteredHolidays;
}

export async function getHolidaysBetweenDates(
    earlierDate: Date,
    laterDate: Date
): Promise<HolidayBrasilAPI[]> {
    const holidays = await getRangeYearHolidays(
        earlierDate.getFullYear(),
        laterDate.getFullYear()
    );

    return filterHolidaysBetweenDates(earlierDate, laterDate, holidays);
}
