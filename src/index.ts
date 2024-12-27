import { config } from 'dotenv'
import { GemMinerBot } from './bot.js'
import { Database } from './database/database.js'

config()

if (!process.env.BOT_TOKEN) {
	console.error('BOT_TOKEN not found')
	process.exit(1)
}

const database = new Database()
const bot = new GemMinerBot(process.env.BOT_TOKEN, database)

await database.connect()
await bot.start()
