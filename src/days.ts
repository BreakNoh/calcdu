import { differenceInCalendarDays } from "date-fns";

export function countDaysBetweenDates(fromDate: Date, toDate: Date) {
    return differenceInCalendarDays(toDate, fromDate);
}
