const fs = require("fs")
const convertSettings = require('./v1Tov2Data/convertSettings')
const convertCategories = require('./v1Tov2Data/convertCateg')
const convertNotes = require('./v1Tov2Data/convertNotes')

fs.readFile('./DataToConvert.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }

    const parsedData = JSON.parse(jsonString)
    const weekids = Object.values(parsedData.yearWeekNumbers)

    // The final system object setup
    const system = {
        init: true,
        weekYearTable: {},
        activitySettings: {},
        categorySettings: {}
    }



    // YEAR WEEK NUMBER LOGIC
    const yearWeekNumbers = Object.keys(parsedData.yearWeekNumbers)

    // Iterate over yearWeekNumbers
    yearWeekNumbers.forEach(yearWeekNumber => { 
        // Gets current week's id
        const weekid = parsedData.yearWeekNumbers[yearWeekNumber]

        // In old version the it was year_weekNr, but 
        // in new one it is weekNr_year hence they have to be switched
        let year = yearWeekNumber.split("_")[0]
        let weekNr = yearWeekNumber.split("_")[1]

        // Set current weeksid in system
        system.weekYearTable[`${weekNr}_${year}`] = weekid
    })
    // YEAR WEEK NUMBER LOGIC




    // SETTINGS LOGIC
    const {activitySettings, categorySettings} = convertSettings()
    system.activitySettings = activitySettings
    system.categorySettings = categorySettings
    // SETTINGS LOGIC
    
    

    // CATEGORY LOGIC
    const categories = {}
    weekids.forEach(wkid => {
        categories[wkid] = convertCategories(parsedData.weeks[wkid].days, activitySettings)
    })
    system["categories"] = categories
    // CATEGORY LOGIC




    // NOTE LOGIC
    const notes = {}
    weekids.forEach(wekid => {
        notes[wekid] = convertNotes(parsedData.notes[wekid], parsedData.noteIndices[wekid])
    })
    system["notes"] = notes
    // NOTE LOGIC


    const jsonStr = JSON.stringify(system)
    
    fs.writeFile('./ConvertedData.json', jsonStr, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })
})
