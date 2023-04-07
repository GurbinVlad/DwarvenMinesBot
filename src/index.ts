import { Bot, Context } from 'grammy';
import { randomInteger } from "./utilities.js";
import { TOKEN } from "./token.js";

class GemMinerBot {
    private bot: Bot;

    constructor(token: string) {
        this.bot = new Bot(token);
        this.bot.command('mine', this.handleMineCommand.bind(this));
        this.bot.start();
        console.log('Bot created');
    }

    private handleMineCommand = (ctx: Context): void => {
        const gems = randomInteger(-5, 10);
        const username = `@${ctx.message?.from.username}`;
        const word = gems === 1 ? 'gem' : 'gems';

        if (gems < 0) {
            const lostGems = -gems;
            const message = `${username}, you lost ${lostGems} ${word}...`;
            ctx.reply(message);
            console.log(`${username}: ${lostGems} ${word} lost`);
        } else if (gems === 0) {
            const message = `${username}, you got nothing.`;
            ctx.reply(message);
            console.log(`${username}: nothing`);
        } else {
            const message = `${username}, you got ${gems} ${word}!`;
            ctx.reply(message);
            console.log(`${username}: ${gems} ${word} mined`);
        }
    };
}

const bot = new GemMinerBot(TOKEN);
