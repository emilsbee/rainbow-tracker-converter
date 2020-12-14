const fs = require("fs")

fs.readFile('./DataToConvert.json', 'utf8', (err, jsonString) => {
    if (err) {
        console.log("File read failed:", err)
        return
    }
    
    var parsedData = JSON.parse(jsonString)

    // Deletes old properties
    delete parsedData.activityConfigs
    delete parsedData.categoryConfigs
    delete parsedData.indexNotes
    delete parsedData.noteIndices
    delete parsedData.weeks
    delete parsedData.years
    delete parsedData.yearWeekNumbers
    delete parsedData.yearWeeks

    parsedData["analytics"] = {}
    
    Object.keys(parsedData.categories).forEach(weekid => {
        // Create analytics object for current weekid
        parsedData.analytics[weekid] = {
            categories: {
                
            }, 
            activities: {
                
            }
        } 

        Object.keys(parsedData.categorySettings).forEach(categid => {
            parsedData.analytics[weekid]["categories"][categid] = 0
        })

        Object.keys(parsedData.activitySettings).forEach(actid => {
            parsedData.analytics[weekid]["activities"][actid] = 0
        })

        console.log(parsedData.analytics)

        for (var i = 0; i < 96*7; i++) { // Iterates over all 15 minute intervals in a week

            // Deletes unnecessary properties
            delete parsedData.categories[weekid][i].short
            delete parsedData.categories[weekid][i].long


            if (parsedData.categories[weekid][i].categoryid !== "") { // If there is a category in this in interval
                var categoryid = parsedData.categories[weekid][i].categoryid // Gets the categoryid

                if (!parsedData["analytics"][weekid]["categories"][categoryid]) { // If this categoryid isn't yet in the analytics object
                
                    parsedData["analytics"][weekid]["categories"][categoryid] = 1 // Initialise this categoryid in analytics object with 1

                } else { // If this categoryid is already in the analytics object
                    
                    var categCount = parseInt(parsedData["analytics"][weekid]["categories"][categoryid])  // Gets the current count for the categoryid and converts it to int
                    categCount += 1 // Increment the current categery count by 1
                    parsedData["analytics"][weekid]["categories"][categoryid] = categCount // Set the new category count 
                }
            }

            if (parsedData.categories[weekid][i].activityid !== "") { // If there is an activity in this in interval
                var activityid = parsedData.categories[weekid][i].activityid // Gets the activityid
 
                if (!parsedData["analytics"][weekid]["activities"][activityid]) { // If this activityid isn't yet in the analytics object

                    parsedData["analytics"][weekid]["activities"][activityid] = 1    // Initialise this activityid in analytics object with 1

                } else { // If this activityid is already in the analytics object

                    var activCount = parseInt(parsedData["analytics"][weekid]["activities"][activityid]) // Gets the current count for the activityid and converts it to int
                    activCount += 1 // Increment the current activity count by 1
                    parsedData["analytics"][weekid]["activities"][activityid] = activCount // Set the new activity count 
                }
            }

        }

    })


    
    const jsonStr = JSON.stringify(parsedData)
    
    fs.writeFile('./ConvertedData.json', jsonStr, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
        }
    })
})

