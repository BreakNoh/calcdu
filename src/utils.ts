import { compareAsc, isValid } from "date-fns";
import { Request } from "express";

export function parseDateQuery(req: Request):
    | {
          sucess: false;
          error: string;
      }
    | { sucess: true; data: [Date, Date] } {
    if (!req.query.de || !req.query.ate) {
        // return res.status(400).send();
        return {
            sucess: false,
            error: "data não especificada",
        };
    }

    const fromDate = new Date(req.query.de.toString());
    const toDate = new Date(req.query.ate.toString());

    if (!isValid(fromDate) || !isValid(toDate)) {
        // return res.status(400).send();
        return {
            sucess: false,
            error: "data inválida",
        };
    }

    if (compareAsc(toDate, fromDate) < 0) {
        return {
            sucess: false,
            error: "data inicial após da final",
        };
    }

    return { sucess: true, data: [fromDate, toDate] };
}
