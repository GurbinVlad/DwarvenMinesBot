import {Bot, CommandContext, Context} from "grammy";
import {randomInteger} from "./utilities.js";

export class GemMinerBot {
    private bot: Bot;

    constructor(token: string) {
        this.bot = new Bot(token);
        this.bot.command('mine', this.handleMineCommand.bind(this));
        this.bot.command('start', this.handleStartCommand.bind(this));
        console.log('Bot created');
    }

    public async botStart(): Promise<void> {
        console.log('Bot started');
        await this.bot.start();
    }

    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const message = `@${ctx.message.from.username}, welcome to Dwarven mines!\nUse the /mine command to go to the mine and try your luck!`
        await ctx.reply(message);
    }

    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const gems = randomInteger(-5, 10);
        const username = `@${ctx.message.from.username}`;
        const word = gems === 1 || gems === -1 ? 'gem' : 'gems';
        let message: string;
        if (gems < 0) {
            const lostGems = -gems;
            message = `${username}, you lost ${lostGems} ${word}💎...`;
        } else if (gems === 0) {
            message = `${username}, you got nothing.`;
        } else {
            message = `${username}, you got ${gems} ${word}💎!`;
        }
        await ctx.reply(message);
        console.log(`${username}: ${gems}`);
    };
}