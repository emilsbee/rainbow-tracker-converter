const { v4: uuidv4 } = require('uuid');


// Converts notes from old to new

const convertNotes = (notes, noteIndices) => {
    const newNotes = []

    // Note text extraction
    Object.keys(notes).forEach(day => {
        Object.keys(notes[day]).forEach((noteid, index) => {
            
            newNotes.push({
                note: notes[day][noteid],
                position: index+1,
                day: day,
                stackid: uuidv4()
            })
        })
    })

    const noteIndiceKeys = Object.keys(noteIndices) // Basically are of the names of days

    // // noteIndices iteration
    noteIndiceKeys.forEach(day => {

        const noteIndiceDayNoteids =  Object.keys(noteIndices[day]) // Array of noteids from a specific day

        
        noteIndiceDayNoteids.forEach(noteid => {
            
            // Array of note indices (from orignal notes) that must be changed to have the same stackid. 
            // This stackid must come from the note that has lowest index.
            const currentIndiceNotePositions = []
        

            // Only add indices to currentIndiceNotePositions if they are true instead of null 
            Object.keys(noteIndices[day][noteid]).forEach(nt => {
                if(noteIndices[day][noteid][nt]) {
                    currentIndiceNotePositions.push(nt)
                }
            }) 
            


            // The lowest index note from the array of indices to be changed
            const lowestIndexNote = Math.min(parseInt(currentIndiceNotePositions)) 
            
            const lowestIndexNoteStackid = newNotes.filter(n => n.day === day && n.position === lowestIndexNote+1)[0].stackid
            

            // Iterate over note indices to be changed
            currentIndiceNotePositions.forEach(indiceToChange => {
                const currentIndice = parseInt(indiceToChange) // Curent index to be changed (has to parsed to an int first)
                

                // Find the same note in new notes array
                newNotes.forEach((newNote, i) => {
                    if (newNote.day === day && newNote.position === currentIndice+1) { // If day and position of note are the same, must be the same note
                        newNotes[i].stackid = lowestIndexNoteStackid
                    }
                })
            })

        })

        
    })

    return newNotes
}

module.exports = convertNotes

