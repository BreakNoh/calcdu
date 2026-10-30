import { compareAsc } from "date-fns";

interface HolidayBrasilAPI {
    date: string;
    name: string;
    type: string;
}

interface HolidayCacheEntry {
    holidays: HolidayBrasilAPI[];
    // null significa que a entrada nunca expira
    expiresAt: number | null;
}

const holidaysCache = new Map<number, HolidayCacheEntry>();
const pendingRequests = new Map<number, Promise<HolidayBrasilAPI[] | null>>();

function getExpirationFor(year: number): number | null {
    const currentYear = new Date().getFullYear();

    // Anos passados e o ano atual não mudam mais
    if (year <= currentYear) {
        return null;
    }

    // Feriados futuros podem ser alterados; revalida quando o ano começar
    return new Date(year, 0, 1).getTime();
}

function getCachedYearHolidays(year: number): HolidayBrasilAPI[] | undefined {
    const entry = holidaysCache.get(year);

    if (!entry) {
        return undefined;
    }

    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
        holidaysCache.delete(year);
        return undefined;
    }

    return entry.holidays;
}

async function requestYearHolidays(
    year: number
): Promise<HolidayBrasilAPI[] | null> {
    const BRASIL_API_ENDPOINT = `https://brasilapi.com.br/api/feriados/v1/${year}`;

    const res = await fetch(BRASIL_API_ENDPOINT);

    if (res.status != 200) {
        return null;
    }

    return (await res.json()) as HolidayBrasilAPI[];
}

async function fetchYearHolidays(
    year: number
): Promise<HolidayBrasilAPI[]> {
    const pending = pendingRequests.get(year);

    if (pending) {
        return (await pending) ?? [];
    }

    const request = requestYearHolidays(year)
        .then((holidays) => {
            // Não guarda falhas da API no cache
            if (holidays) {
                holidaysCache.set(year, {
                    holidays,
                    expiresAt: getExpirationFor(year)
                });
            }

            return holidays;
        })
        .finally(() => pendingRequests.delete(year));

    pendingRequests.set(year, request);

    return (await request) ?? [];
}

export async function getYearHolidays(
    year: number
): Promise<HolidayBrasilAPI[]> {
    const cached = getCachedYearHolidays(year);

    if (cached) {
        return cached;
    }

    return await fetchYearHolidays(year);
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
