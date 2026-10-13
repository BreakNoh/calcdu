import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compareAsc, endOfDay, getDay, startOfDay } from "date-fns";
import z from "zod";
import {
    addToDate,
    getBusinessDays,
    getCalendarDays,
    getHolidays,
    getInterval,
    getWeekends,
} from "./days.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readmePath = path.resolve(__dirname, "../README.md");

const app = express();
const port = 8080;

app.get("/", (req, res) => {
    res.sendFile(readmePath);
});

const schemaAdicionar = z.object({
    ref: z.coerce.date(),
    qnt: z.coerce.number(),
    un: z.enum(["w", "d", "b", "h", "m", "y", "f"]),
});

app.get("/api/adicionar", async (req, res) => {
    const parse = schemaAdicionar.safeParse(req.query);
    if (!parse.success) {
        return res.status(400).send();
    }

    const { ref: refDate, qnt: quantity, un: unity } = parse.data;

    const result = await addToDate(refDate, quantity, unity);

    res.send(result);
});

app.get("/api/subtrair", async (req, res) => {
    const parse = schemaAdicionar.safeParse(req.query);
    if (!parse.success) {
        return res.status(400).send();
    }

    const { ref: refDate, qnt: quantity, un: unity } = parse.data;

    const result = await addToDate(refDate, -quantity, unity);

    res.send(result);
});

const schemaIntervalo = z
    .object({
        de: z.coerce.date(),
        ate: z.coerce.date(),
    })
    .refine(({ de, ate }) => compareAsc(ate, de) >= 0);

app.get("/api/dias-corridos", (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const result = getCalendarDays(fromDate, toDate);
    return res.send({ count: result });
});

app.get("/api/dias-uteis", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const result = await getBusinessDays(fromDate, toDate);
    res.send({ count: result });
});

app.get("/api/feriados", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const holidays = await getHolidays(fromDate, toDate);
    res.send({
        count: holidays.length,
        holidyas: holidays,
    });
});

// app.get("/fins-de-semana", async (req, res) => {
//     const SATURDAY = 6;
//     const parse = schemaIntervalo.safeParse(req.query);
//
//     if (!parse.success) {
//         return res.status(400).send();
//     }
//
//     const { de: fromDate, ate: toDate } = parse.data;
//     console.log(fromDate, toDate);
//
//     const weekends = getWeekends(fromDate, toDate);
//
//     let saturdays, sundays;
//
//     if (getDay(fromDate) == SATURDAY) {
//         // se data inicial for um sábado <=> mais domingos
//         saturdays = Math.floor(weekends / 2);
//         sundays = Math.ceil(weekends / 2);
//     } else {
//         // se data inicial não for um sábado <=> mais sábados
//         saturdays = Math.ceil(weekends / 2);
//         sundays = Math.floor(weekends / 2);
//     }
//
//     res.send({
//         count: weekends,
//         saturdays,
//         sundays,
//     });
// });

app.get("/api/intervalo", async (req, res) => {
    const parse = schemaIntervalo.safeParse(req.query);

    if (!parse.success) {
        return res.status(400).send();
    }

    const { de: fromDate, ate: toDate } = parse.data;

    const result = await getInterval(fromDate, toDate);
    res.send(result);
});

app.listen(port, () => {
    console.log("Servidor iniciado");
});
