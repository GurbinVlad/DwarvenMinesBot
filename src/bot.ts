import {Bot, CommandContext, Context} from "grammy";
import {randomInteger} from "./utilities.js";
import {Database} from "./database/database.js";

export class GemMinerBot {
    private bot: Bot;
    private relax = 10;

    constructor(token: string, private database:Database) {
        this.bot = new Bot(token);
        this.bot.command('mine', this.handleMineCommand.bind(this));
        this.bot.command('start', this.handleStartCommand.bind(this));
        this.bot.command('profile', this.handleProfileCommand.bind(this));
        console.log('Bot created');
    }

    public async start(): Promise<void> {
        console.log('Bot started');
        await this.bot.start();
    }

    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const message = `@${ctx.message.from.username}, welcome to Dwarven mines!\nUse the /mine command to go to the mine and try your luck!`
        await ctx.reply(message);
    }

    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        if( Date.now() - Number(user.lastMined) < this.relax*1000 ){
            await ctx.reply("You can't mine now. Try again in " + Math.floor(this.relax - (Date.now() - Number(user.lastMined)) / 1000) + " sec")
            return;
        }

        const gems = randomInteger(-5, 10);
        const username = `@${ctx.message.from.username}`;
        const word = gems === 1 || gems === -1 ? 'gem' : 'gems';
        let message: string;
        if (gems < 0) {
            message = `${username}, you lost ${-gems} ${word}💎...`;
        } else if (gems === 0) {
            message = `${username}, you got nothing.`;
        } else {
            message = `${username}, you got ${gems} ${word}💎!`;
        }


        if(user.gemsCount + gems < 0){
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, 0);
        } else {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, gems);
        }

        await ctx.reply(message);
        console.log(`${username}: ${gems}`);
    };

    private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply("Profile of " + ctx.message.from.first_name + "\nGems in a bag: " + user.gemsCount + "💎")
    };

}