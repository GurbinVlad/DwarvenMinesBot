import { config } from "dotenv";
import { GemMinerBot } from "./bot.js"
import { Database } from "./database/database.js";
import { Migrations } from "./database/migrations.js";

config();

if (!process.env.TOKEN) {
    console.error(`TOKEN not found`);
    process.exit(1);
}

const database = new Database();
const migrations = new Migrations();
const bot = new GemMinerBot(process.env.TOKEN, database, migrations);

await database.connect();
await bot.start();