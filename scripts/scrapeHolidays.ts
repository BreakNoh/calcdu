import { getDay } from "date-fns";
import { getYearHolidays } from "../src/feriados";
import Database from "better-sqlite3";

const db = new Database("calcu.db", { verbose: console.log });
const saveDateStmt = db.prepare(`
	INSERT INTO holidays(date, name, type, weekday) VALUES (?, ?, ?, ?);
`);

db.exec(`
	CREATE TABLE IF NOT EXISTS holidays (
		id INT AUTOINCREMENT PRIMARY KEY,
		date TEXT NOT NULL,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		weekday INT NOT NULL
	);
`);

const FIRST_YEAR = 2000;
const LAST_YEAR = 2050;

for (let i = 0; i <= LAST_YEAR - FIRST_YEAR; i++) {
    setTimeout(async () => {
        const holidays = await getYearHolidays(FIRST_YEAR + i);
        holidays.forEach(({ date, name, type }) => {
            saveDateStmt.run(date, name, type, getDay(date));
        });
        console.log(`Feriados de ${FIRST_YEAR + i} raspados`);
    }, i * 1000);
}
