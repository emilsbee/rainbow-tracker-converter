// External imports
import {PoolClient} from "pg";

// Internal imports
import {NewWeek, OldWeek} from "./types";
import {pool, USER_ID} from "./index";
import {DateTime} from "luxon";

/**
 * Saves new weeks to database.
 * @param newWeeks to save.
 */
export const saveNewWeeks = async (newWeeks: NewWeek[]):Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createWeekQuery = 'INSERT INTO week(weekid, userid, "weekNr", "weekYear") VALUES($1, $2, $3, $4);'

        for (let i = 0; i < newWeeks.length; i++) {
            let week: NewWeek = newWeeks[i]
            let values = [week.weekid, USER_ID, week.weekNr, week.weekYear]
            await client.query(createWeekQuery, values)
        }

        await client.query("COMMIT")
    } catch(e) {
        console.error(e)
        await client.query("ROLLBACK")
    } finally {
        client.release()
    }
}

/**
 * Converts old weeks (weekYearTable) to new weeks.
 * @param oldWeeks to convert.
 */
export const convertWeeks = (oldWeeks: OldWeek): NewWeek[] => {
    const newWeeks: NewWeek[] = []

    Object.keys(oldWeeks).forEach(weekDate => {
        let weekNr = parseInt(weekDate.split("_")[0])
        let weekYear = parseInt(weekDate.split("_")[1])

        let validWeek = DateTime.fromObject({weekNumber: weekNr, weekYear}).toISODate()

        if (validWeek) {
            newWeeks.push({
                weekid: oldWeeks[weekDate],
                userid: USER_ID,
                weekNr,
                weekYear
            })
        }
    })

    return  newWeeks
}