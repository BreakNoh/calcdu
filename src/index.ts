import express from "express";
import {
    addBusinessDays,
    addDays,
    addMonths,
    addWeeks,
    addYears,
    compareAsc,
    differenceInBusinessDays,
    differenceInCalendarDays,
    getDay,
} from "date-fns";
import { getHolidaysBetweenDates } from "./feriados.js";
import z from "zod";

const app = express();
const port = 8080;

const schemaAdicionar = z.object({
    ref: z.coerce.date(),
    qnt: z.coerce.number(),
    un: z.enum(["w", "d", "b", "h", "m", "y"]),
});

app.get("/add", (req, res) => {
    const parse = schemaAdicionar.safeParse(req.query);
    if (!parse.success) {
        return res.status(400).send();
    }

    const { ref: refDate, qnt: quantity, un: unity } = parse.data;

    let result = null;
    switch (unity) {
        case "y":
            result = addYears(refDate, quantity);
            break;
        case "m":
            result = addMonths(refDate, quantity);
            break;
        case "w":
            result = addWeeks(refDate, quantity);
            break;
        case "d":
            result = addDays(refDate, quantity);
            break;
        case "b":
            result = addBusinessDays(refDate, quantity);
            break;
        case "h":
            break;
    }

    res.send(result);
});

const schemaIntervalo = z
    .object({
        de: z.coerce.date(),
        ate: z.coerce.date(),
    })
    .refine(({ de, ate }) => compareAsc(ate, de) >= 0);

app.get("/dias-corridos", (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const days = differenceInCalendarDays(toDate, fromDate);
    return res.send({ days });
});

app.get("/dias-uteis", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const businessDays = differenceInBusinessDays(toDate, fromDate);
    const holidays = await getHolidaysBetweenDates(fromDate, toDate);
    const countedHolidays = new Set();
    let coutedDays = businessDays;

    holidays.forEach(({ date }) => {
        const weekday = getDay(date);
        const SUNDAY = 0;
        const SATURDAY = 6;

        if (
            ![SUNDAY, SATURDAY].includes(weekday) &&
            !countedHolidays.has(date)
        ) {
            countedHolidays.add(date);
            coutedDays -= 1;
        }
    });

    res.send({
        businessDays: coutedDays,
        holidays: holidays.map(({ date, name }) => {
            return { date, name };
        }),
    });
});

app.get("/feriados", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const holidays = await getHolidaysBetweenDates(fromDate, toDate);

    res.send(holidays);
});

app.listen(port, () => {
    console.log("Servidor iniciado");
});
