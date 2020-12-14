const fs = require("fs")

// Converts settings from old to new

const convertSettings = () => {
    var activitySettings = {} // activitySettings object that will be updated 

    const settingsDataJSON = fs.readFileSync('./DataToConvert.json', 'utf8')
    const settingsData = JSON.parse(settingsDataJSON)

    // Array of categoryids extracted 
    const activitySettingsCategoryids = Object.keys(settingsData.activityConfigs) 

    // Iterates over categoryids
    activitySettingsCategoryids.forEach(catid => {
        
        // Array of activityids of a specifc category
        const categoryActivityids = Object.keys(settingsData.activityConfigs[catid])
        
        // Iterates over activityids of a specific category
        categoryActivityids.forEach(activid => {

            // Sets the activity in new structure 
            activitySettings[activid] = {
                categoryid: catid, 
                short: settingsData.activityConfigs[catid][activid].short,  
                long: settingsData.activityConfigs[catid][activid].long}
        })
    })

    // Since categoryConfigs (old) has the same structure as categorySettings (new)
    // they it can just be reassigned
    const categorySettings = settingsData.categoryConfigs

    return {activitySettings, categorySettings}
}

module.exports = convertSettings