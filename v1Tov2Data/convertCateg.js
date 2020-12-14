// Converts the categories from old to new

const convertCategories = (categoriesToConvert, activitySettings) => {

    const categoryKeys = Object.keys(categoriesToConvert) // Basically day names
    
    const categories = [] // The array for converted categories

    categoryKeys.forEach(day => { // Iterates through the day names
        
        const categoryDay = categoriesToConvert[day] // Array of categories/activities of said day
        
        categoryDay.forEach((category, index) => {

            // Checks if the activityid is valid because some older categories/activities
            // might have id's of non-existing categories/activities because they were simply deleted
            if (activitySettings[category.activity] !== undefined) { 
            
                categories.push({
                    day,
                    position: index+1,
                    activityid: category.activity,
                    categoryid: category.category,
                    short: activitySettings[category.activity].short,
                    long: activitySettings[category.activity].long 
                })
            } else {
                categories.push({
                    day,
                    position: index+1,
                    activityid: category.activity ? category.activity : "",
                    categoryid: category.category ? category.category : "", 
                    short: "",
                    long: ""
                })
            }

            
        })
    })

    return categories
}

module.exports = convertCategories

