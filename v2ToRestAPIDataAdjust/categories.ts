// External imports
import {PoolClient} from "pg";

// Internal imports
import {ActivitySettingsTable, CategorySettingsTable, NewCategory, OldCategory} from "./types";
import {pool, USER_ID, WEEK_DAY_ARR} from "./index";

/**
 * Saves new categories to database.
 * @param newCategories to save.
 */
export const saveNewCategories = async (newCategories: NewCategory[]):Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createCategoryQuery:string = 'INSERT INTO category(weekid, "weekDay", "categoryPosition", userid, categoryid, activityid) VALUES($1, $2, $3, $4, $5, $6);'

        for (let i = 0; i < newCategories.length; i++) {
            let category = newCategories[i]
            let values = [category.weekid, category.weekDay, category.categoryPosition, USER_ID, category.categoryid, category.activityid]
            await client.query(createCategoryQuery, values)
        }

        await client.query("COMMIT")
    } catch (e) {
        console.error(e)
        await client.query("ROLLBACK")
    } finally {
        client.release()
    }
}

/**
 * Converts old categories to new categories with new categoryid and activityids
 * using the category and activity settings table.
 * @param oldCategories to convert.
 * @param categorySettingsTable to use for categoryid conversion.
 * @param activitySettingsTable to use for activityid conversion.
 */
export const convertCategories = (oldCategories: OldCategory, categorySettingsTable: CategorySettingsTable, activitySettingsTable: ActivitySettingsTable):NewCategory[] => {
    let newCategories: NewCategory[] = []

    Object.keys(oldCategories).forEach(weekid => {
        let oldCategoryArr = oldCategories[weekid]

        oldCategoryArr.forEach(oldCategory => {
            // Categoryid
            let categoryid:string | null;

            if (oldCategory.categoryid.length === 0) {
                categoryid = null
            } else {
                const categorySettingsTableEntry = categorySettingsTable.find(entry => entry.oldCategoryid === oldCategory.categoryid)

                if (!categorySettingsTableEntry) {
                    throw new Error("Category setting " + oldCategory.categoryid + " does not exist in the category settings table " + categorySettingsTable)
                } else {
                    categoryid = categorySettingsTableEntry.newCategoryid
                }
            }

            // Activityid
            let activityid: string | null

            if (oldCategory.activityid.length === 0) {
                activityid = null
            } else {
                const activitySettingsTableEntry = activitySettingsTable.find(entry => entry.oldActivityid === oldCategory.activityid)

                if (!activitySettingsTableEntry) {
                    throw new Error("Activity setting " + oldCategory.activityid + " does not exist in the activity settings table " + activitySettingsTable)
                } else {
                    activityid = activitySettingsTableEntry.newActivityid
                }
            }

            // Week day
            let weekDay = WEEK_DAY_ARR.findIndex(stringDay => stringDay === oldCategory.day)

            if (weekDay === -1) {
                throw new Error("Week day conversion gone bad for categories. The day: " + oldCategory.day)
            }

            newCategories.push({
                weekid,
                weekDay,
                categoryPosition: oldCategory.position,
                userid: USER_ID,
                categoryid,
                activityid
            })
        })
    })

    return newCategories
}