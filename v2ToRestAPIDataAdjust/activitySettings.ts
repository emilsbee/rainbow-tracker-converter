// External imports
import {PoolClient} from "pg";
import {v4 as uuidv4} from "uuid";

// Internal imports
import {ActivitySettingsTable, CategorySettingsTable, NewActivityType, OldActivitySetting} from "./types";
import {pool, USER_ID} from "./index";

/**
 * Saves new activity types to database.
 * @param newActivityTypes to save to database.
 */
export const saveNewActivityTypes = async (newActivityTypes: NewActivityType[]):Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createActivityTypeQuery = "INSERT INTO activity_type(activityid, categoryid, userid, long, short, archived) VALUES($1, $2, $3, $4, $5, $6)"

        for (let i = 0; i < newActivityTypes.length; i++) {
            let activityType = newActivityTypes[i]
            let values = [activityType.activityid, activityType.categoryid, USER_ID, activityType.long, activityType.short, activityType.archived]
            await client.query(createActivityTypeQuery, values)
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
 * Given the old activity settings, this function creates an activity settings table which is an array of
 * objects containing oldActivityid and newActivityid. This is necessary because a lot of the oldActivityids
 * are not unique so new unique ones have to be generated.
 * @param oldActivitySettings from which to create the activity settings table.
 */
export const getActivitySettingsTable = (oldActivitySettings: OldActivitySetting):ActivitySettingsTable => {
    const activitySettingsTable: ActivitySettingsTable = []

    Object.keys(oldActivitySettings).forEach(activityid => {
        activitySettingsTable.push({
            oldActivityid: activityid,
            newActivityid: uuidv4()
        })
    })

    return activitySettingsTable
}

/**
 * Converts old activity settings to new activity types with new activityids
 * using the activity settings table.
 * @param oldActivitySettings to convert.
 * @param activitySettingsTable which to use for new activityids.
 * @param categorySettingsTable which to use for new categoryids.
 */
export const convertActivityTypes = (oldActivitySettings: OldActivitySetting, activitySettingsTable: ActivitySettingsTable, categorySettingsTable: CategorySettingsTable): NewActivityType[] => {
    let newActivityTypes: NewActivityType[] = []

    Object.keys(oldActivitySettings).forEach(activityid => {

        let activitySettingsTableEntry = activitySettingsTable.find(activitySetting => activitySetting.oldActivityid === activityid)
        let categorySettingsTableEntry = categorySettingsTable.find(categorySetting => categorySetting.oldCategoryid === oldActivitySettings[activityid].categoryid)
        let newActivityid: string;
        let newCategoryid: string;

        if (activitySettingsTableEntry && categorySettingsTableEntry) {
            newActivityid = activitySettingsTableEntry.newActivityid
            newCategoryid = categorySettingsTableEntry.newCategoryid
        } else {
            throw new Error("Activity setting does not have a valid category setting.")
        }

        newActivityTypes.push({
            activityid: newActivityid,
            categoryid: newCategoryid,
            userid: USER_ID,
            long: oldActivitySettings[activityid].long,
            short: oldActivitySettings[activityid].short,
            archived: false
        })
    })

    return newActivityTypes
}