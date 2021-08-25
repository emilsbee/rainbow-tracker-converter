// External imports
import {v4 as uuidv4} from "uuid";
import {PoolClient} from "pg";

// Internal imports
import {ActivitySettingsTable, CategorySettingsTable, NewCategoryType, OldCategory, OldCategorySetting} from "./types";
import {pool, USER_ID} from "./index";

/**
 * Given the old category settings, this function creates a category settings table which is an array of
 * objects containing oldCategoryid and newCategoryid. This is necessary because a lot of the oldCategoryids
 * are not unique so new unique ones have to be generated.
 * @param oldCategorySettings from which to create the category settings table.
 */
export const getCategorySettingsTable = (oldCategorySettings: OldCategorySetting):CategorySettingsTable => {
    const categorySettingsTable: CategorySettingsTable = []

    Object.keys(oldCategorySettings).forEach(categoryid => {
        categorySettingsTable.push({oldCategoryid: categoryid, newCategoryid: uuidv4()})
    })

    return categorySettingsTable
}

/**
 * Saves new category types to database.
 * @param newCategoryTypes to save to database.
 */
export const saveNewCategoryTypes = async (newCategoryTypes: NewCategoryType[]):Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createCategoryTypeQuery = "INSERT INTO category_type(categoryid, userid, color, name, archived) VALUES($1, $2, $3, $4, $5);"

        for (let i = 0; i < newCategoryTypes.length; i++) {
            let categoryType = newCategoryTypes[i]
            let values = [categoryType.categoryid, USER_ID, categoryType.color, categoryType.name, categoryType.archived]
            await client.query(createCategoryTypeQuery, values)
        }

        await client.query("COMMIT")
    } catch (e) {
        console.error(e)
        await client.query('ROLLBACK')
    } finally {
        client.release()
    }
}

/**
 * Converts old category settings to new category types with new categoryids
 * using the category settings table.
 * @param oldCategorySettings to convert.
 * @param categorySettingsTable which to use for new categoryids.
 */
export const convertCategoryTypes = (oldCategorySettings: OldCategorySetting, categorySettingsTable: CategorySettingsTable): NewCategoryType[] => {
    const newTypes: NewCategoryType[] = []

    Object.keys(oldCategorySettings).forEach(categoryid => {

        let categorySettingsTableEntry = categorySettingsTable.find(categorySetting => categorySetting.oldCategoryid === categoryid)
        let newCategoryid: string;

        if (categorySettingsTableEntry) {
            newCategoryid = categorySettingsTableEntry.newCategoryid
        } else {
            throw new Error("Category setting does not have a generated new categoryid in the category settings table.")
        }

        newTypes.push({
            categoryid: newCategoryid,
            userid: USER_ID,
            color: oldCategorySettings[categoryid].color,
            name: oldCategorySettings[categoryid].category,
            archived: false
        })
    })

    return newTypes
}

/**
 *  Iterates through the categories and using category and activity type tables
 *  finds which categories reference non-existing category/activity types.
 */
export const findMissingCategoryAndActivityTypes = (
    categories: OldCategory,
    categorySettingsTable: CategorySettingsTable,
    activitySettingsTable: ActivitySettingsTable
): {categoryTypes: Set<string>, activityTypes: Set<string>} => {
    const fakeCategoryids: string[] = []
    const fakeActivityids: string[] = []

    Object.keys(categories).forEach(weekid => {
        categories[weekid].forEach(category => {
            if (category.categoryid.length !== 0) {
                const categorySettingsTableEntry = categorySettingsTable.find(entry => entry.oldCategoryid === category.categoryid)

                if (!categorySettingsTableEntry) {
                    fakeCategoryids.push(category.categoryid)
                }
            }

            if (category.activityid.length !== 0) {
                const activitySettingsTableEntry = activitySettingsTable.find(entry => entry.oldActivityid === category.activityid)

                if (!activitySettingsTableEntry) {
                    fakeActivityids.push(category.activityid)
                }
            }
        })
    })

    return {categoryTypes: new Set(fakeCategoryids), activityTypes: new Set(fakeActivityids)}
}