/**
 * This file converts types used in the v2 to REST API converter.
 */


/**
 * Below are types for the v2 data.
 */
export type OldCategorySetting = {
    [index:string]: {
            category: string,
            color: string
    }
}

export type OldActivitySetting = {
    [index:string]: {
        categoryid: string,
        long: string,
        short: string
    }
}

export type OldWeek = {
    [index:string]: string
}

export type OldCategory = {
    [index:string]: {
        activityid: string
        categoryid: string
        day: string
        position: number
    }[]
}

export type OldNote = {
    [index:string]: {
        day: string
        note: string
        position: number
        stackid: string
    }[]
}

/**
 * Below are types for the REST API data.
 */
export type NewCategoryType = {
    categoryid:string,
    userid:string,
    color:string,
    name:string,
    archived:boolean
}

export type NewActivityType = {
    activityid:string,
    categoryid:string,
    userid:string,
    long:string,
    short:string,
    archived:boolean
}

export type NewWeek = {
    weekid: string,
    userid: string,
    weekNr: number,
    weekYear: number
}

export type NewCategory = {
    weekid: string,
    weekDay: number,
    categoryPosition: number,
    userid: string,
    categoryid: string | null,
    activityid: string | null
}

export type NewNote = {
    weekid: string,
    weekDay: number,
    notePosition: number,
    stackid: string,
    userid: string,
    note: string
}

/**
 * Below are miscellaneous types.
 */
export type CategorySettingsTable = {
    oldCategoryid: string
    newCategoryid: string
}[]

export type ActivitySettingsTable = {
    oldActivityid: string
    newActivityid: string
}[]
