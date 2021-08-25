// External imports
import {PoolClient} from "pg";

// Internal imports
import {ActivitySettingsTable, CategorySettingsTable, NewCategory, OldCategory, OldWeek} from "./types";
import {pool, replacementTypes, USER_ID, WEEK_DAY_ARR} from "./index";
import {DateTime} from "luxon";

/**
 * Saves new categories to database.
 * @param newCategories to save.
 */
export const saveNewCategories = async (newCategories: NewCategory[]):Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createCategoryQuery:string = 'INSERT INTO category(weekid, "weekDay", "categoryPosition", userid, categoryid, activityid, "weekDayDate") VALUES($1, $2, $3, $4, $5, $6, $7);'

        for (let i = 0; i < newCategories.length; i++) {
            let category = newCategories[i]
            let values = [category.weekid, category.weekDay, category.categoryPosition, USER_ID, category.categoryid, category.activityid, category.weekDayDate]
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
export const convertCategories = (oldCategories: OldCategory, categorySettingsTable: CategorySettingsTable, activitySettingsTable: ActivitySettingsTable, weekYearTable: OldWeek):NewCategory[] => {
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
                    // Checks whether the current category is in replacement type table
                    let isCategoryInReplacementTable = replacementTypes.categoryTypes.find(categoryType => categoryType.badCategoryid === oldCategory.categoryid)

                    if (isCategoryInReplacementTable) {
                        let categoryReplacementId = isCategoryInReplacementTable.goodCategoryid
                        let newCategType = categorySettingsTable.find(entry => entry.oldCategoryid === categoryReplacementId)

                        if (newCategType) {
                            categoryid = newCategType.newCategoryid
                        } else {
                            throw new Error("Category replacement" + categoryReplacementId  + "does not exist in the categorySettingsTable.")
                        }
                    } else {
                        throw new Error("Category " + oldCategory.categoryid + " does not exist in the category settings table or replacement categories." + categorySettingsTable)
                    }
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
                    // Checks whether the current activity is in replacement type table
                    let isInReplacementTable = replacementTypes.activityTypes.find(activityType => activityType.badActivityid === oldCategory.activityid)

                    if (isInReplacementTable) {
                        let replacementId = isInReplacementTable.goodActivityid
                        let newActivType = activitySettingsTable.find(entry => entry.oldActivityid === replacementId)

                        if (newActivType) {
                            activityid = newActivType.newActivityid
                        } else {
                            throw new Error("Activity replacement" + replacementId  + "does not exist in the activitySettingsTable.")
                        }
                    } else {
                        throw new Error("Activity " + oldCategory.activityid + " does not exist in the activity settings table or replacement activities." + activitySettingsTable)
                    }
                } else {
                    activityid = activitySettingsTableEntry.newActivityid
                }
            }

            // Week day
            let weekDay = WEEK_DAY_ARR.findIndex(stringDay => stringDay === oldCategory.day)

            if (weekDay === -1) {
                throw new Error("Week day conversion gone bad for categories. The day: " + oldCategory.day)
            }

            // Week day date
            let weekDayDate: string | null = null
            Object.keys(weekYearTable).forEach(week_year => {
                if (weekYearTable[week_year] === weekid) {
                    let weekNr = week_year.split("_")[0]
                    let year = week_year.split("_")[1]
                    weekDayDate = DateTime.fromISO(`${year}-W${String(weekNr).padStart(2, '0')}-${weekDay+1}`).toISODate()
                }
            })

            if (weekDayDate) {
                newCategories.push({
                    weekid,
                    weekDay,
                    categoryPosition: oldCategory.position,
                    userid: USER_ID,
                    categoryid,
                    activityid,
                    weekDayDate
                })
            }
        })
    })

    return newCategories
}
