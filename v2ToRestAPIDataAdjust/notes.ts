// External imports
import {PoolClient} from "pg";

// Internal imports
import {NewNote, OldNote} from "./types";
import {pool, USER_ID, WEEK_DAY_ARR} from "./index";

/**
 * Saves new notes to database.
 * @param newNotes to save.
 */
export const saveNewNotes = async (newNotes: NewNote[]): Promise<void> => {
    const client: PoolClient = await pool.connect()

    try {
        // Begin transaction
        await client.query("BEGIN")

        const createNoteQuery:string = 'INSERT INTO note(weekid, "weekDay", "notePosition", stackid, userid, note) VALUES($1, $2, $3, $4, $5, $6);'

        for (let i = 0; i < newNotes.length; i++) {
            let note = newNotes[i]
            let values = [note.weekid, note.weekDay, note.notePosition, note.stackid, USER_ID, note.note]
            await client.query(createNoteQuery, values)
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
 * Converts old notes to new notes.
 * @param oldNotes to convert.
 */
export const convertNotes = (oldNotes: OldNote): NewNote[] => {
    const newNotes: NewNote[] = []

    Object.keys(oldNotes).forEach(weekid => {
        let oldNoteArr = oldNotes[weekid]

        oldNoteArr.forEach(note => {
            // Week day
            let weekDay = WEEK_DAY_ARR.findIndex(stringDay => stringDay === note.day)

            if (weekDay === -1) {
                throw new Error("Week day conversion gone bad for notes. The day: " + note.day)
            }

            newNotes.push({
                weekid,
                weekDay,
                notePosition: note.position,
                stackid: note.stackid,
                userid: USER_ID,
                note: note.note
            })
        })
    })

    return newNotes
}