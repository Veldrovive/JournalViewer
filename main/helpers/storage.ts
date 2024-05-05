import { app, ipcMain } from 'electron'
import fs from 'fs'

const savePath = `${app.getPath('userData')}/storage`
// Create the storage dir if it doesn't exist
if (!fs.existsSync(savePath)) {
    fs.mkdirSync(savePath)
}

const save = async (key: string, value: any) => {
    const filePath = `${savePath}/${key}.json`
    fs.writeFileSync(filePath, JSON.stringify(value))
}

const load = async (key: string) => {
    const filePath = `${savePath}/${key}.json`
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath)
        return JSON.parse(data.toString())
    }
}

ipcMain.on('save', async (message_event, { key, value }) => {
    // console.log('Got save message', key, value)
    save(key, value)
})

ipcMain.on('load', async (message_event, key) => {
    // console.log('Got load message', key)
    const value = await load(key)
    message_event.reply('load', value)
})
