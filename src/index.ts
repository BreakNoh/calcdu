import express from "express";
import {
    addBusinessDays,
    addDays,
    addMonths,
    addWeeks,
    addYears,
    compareAsc,
} from "date-fns";
import z from "zod";
import {
    addHolidays,
    getBusinessDays,
    getCalendarDays,
    getHolidays,
} from "./days.js";

const app = express();
const port = 8080;

const schemaAdicionar = z.object({
    ref: z.coerce.date(),
    qnt: z.coerce.number(),
    un: z.enum(["w", "d", "b", "h", "m", "y"]),
});

app.get("/add", async (req, res) => {
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
            result = await addHolidays(refDate, quantity);
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

    const result = getCalendarDays(fromDate, toDate);
    return res.send(result);
});

app.get("/dias-uteis", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const result = await getBusinessDays(fromDate, toDate);
    res.send(result);
});

app.get("/feriados", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const holidays = await getHolidays(fromDate, toDate);
    res.send(holidays);
});

app.listen(port, () => {
    console.log("Servidor iniciado");
});
