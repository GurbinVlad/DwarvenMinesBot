import {TOKEN} from "./token.js"
import {GemMinerBot} from "./bot.js"
import {Database} from "./database/database.js";

const database = new Database();
const bot = new GemMinerBot(TOKEN, database);
await database.connect();
await bot.start();