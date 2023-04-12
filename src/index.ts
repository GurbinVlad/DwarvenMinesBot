import {TOKEN} from "./token.js"
import {GemMinerBot} from "./bot.js"
import {connectToDb} from "./database/connection.js";

const bot = new GemMinerBot(TOKEN);
await connectToDb();
bot.botStart();