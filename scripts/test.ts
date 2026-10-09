import {
    filterHolidaysBetweenDates,
    getRangeYearHolidays,
    getYearHolidays,
} from "../src/feriados.ts";

const feriados = await getYearHolidays(2026);

console.log(
    filterHolidaysBetweenDates(
        new Date("2026-10-01"),
        new Date("2026-12-01"),
        feriados
    )
);
