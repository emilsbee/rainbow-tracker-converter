// External imports
import fs from "fs"
import {Pool} from "pg"

// Internal imports
import {
    ActivitySettingsTable,
    CategorySettingsTable,
    OldActivitySetting, OldCategory,
    OldCategorySetting, OldNote, OldWeek
} from "./types";
import {
    convertCategoryTypes,
    findMissingCategoryAndActivityTypes,
    getCategorySettingsTable,
    saveNewCategoryTypes
} from "./categorySettings";
import {convertActivityTypes, getActivitySettingsTable, saveNewActivityTypes} from "./activitySettings";
import {convertWeeks, saveNewWeeks} from "./weeks";
import {convertCategories, saveNewCategories} from "./categories";
import {convertNotes, saveNewNotes} from "./notes";

require('dotenv').config()

/**
 * Constants.
 */
export let USER_ID = ""

if (process.argv.length === 3) {
    USER_ID = process.argv[2]
} else {
    throw new Error("You must provide arguments userid.")
}
export const replacementTypes = {
    categoryTypes: [{
        badCategoryid: "-M8juLkKKWE7GmitaWD2",
        goodCategoryid: "-M8tuD433a28Qm8Cj7ft"
    }],
    activityTypes: [
        {
            badActivityid: "-M8juLkKKWE7GmitaWD3",
            goodActivityid: "-M8tuD433a28Qm8Cj7fu"
        },
        {
            badActivityid: "-M8juLkL1Nw0-Snc1iVO",
            goodActivityid: "-M8tuD433a28Qm8Cj7fx"
        },
        {
            badActivityid: "-M8juLkKKWE7GmitaWD1",
            goodActivityid: "-M8tuD433a28Qm8Cj7fw"
        }
    ]
}
const INPUT_FILE_NAME = "DataToConvert.json"
export const WEEK_DAY_ARR = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export const pool = new Pool({
    password: process.env.PGPASSWORD,
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432
})


fs.readFile(INPUT_FILE_NAME, async (err, data) => {
    if (err) {
        console.error(err)
        process.exit(1)
    }

    const parsedData = JSON.parse(data.toString()) as {categorySettings: OldCategorySetting, activitySettings: OldActivitySetting, weekYearTable: OldWeek, categories: OldCategory, notes: OldNote}

    /**
     * Category settings/types
     */
    const categorySettingsTable: CategorySettingsTable = getCategorySettingsTable(parsedData.categorySettings)
    await saveNewCategoryTypes(convertCategoryTypes(parsedData.categorySettings, categorySettingsTable))

    /**
     * Activity settings/types
     */
    const activitySettingsTable: ActivitySettingsTable = getActivitySettingsTable(parsedData.activitySettings)
    await saveNewActivityTypes(convertActivityTypes(parsedData.activitySettings, activitySettingsTable, categorySettingsTable))

    /**
     * Weeks
     */
    await saveNewWeeks(convertWeeks(parsedData.weekYearTable))

    /**
     * Categories
     */
    await saveNewCategories(convertCategories(parsedData.categories, categorySettingsTable, activitySettingsTable, parsedData.weekYearTable))

    /**
     * Notes
     */
    await saveNewNotes(convertNotes(parsedData.notes, parsedData.weekYearTable))
})
