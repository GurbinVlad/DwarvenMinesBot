import {Bot, CommandContext, Context } from "grammy";
import {randomInteger} from "./utilities.js";
import {Database} from "./database/database.js";

export class GemMinerBot {
    private bot: Bot;
    private cooldown = 1;

    constructor(token: string, private database:Database) {
        this.bot = new Bot(token);
        this.bot.command('start', this.handleStartCommand.bind(this));
        this.bot.command('name', this.handleSetNameCommand.bind(this));
        this.bot.command('command_list', this.handleCommandListCommand.bind(this));
        this.bot.command('mine', this.handleMineCommand.bind(this));
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
        const message = `@${ctx.message.from.username}, welcome to Dwarven mines!
Use /command_list to see all available commands in the game. Good luck in the game! ✨`
        await ctx.reply(message);
    }

    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        if( Date.now() - Number(user.lastMined) < this.cooldown * 60_000 ){
            await ctx.reply("You can't mine now. Try again in " + Math.floor(this.cooldown * 60 - (Date.now() - Number(user.lastMined)) / 1000) + " sec")
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
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, user.heroName, 0);
        } else {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, user.heroName, gems);
        }

        await ctx.reply(message);
        console.log(`${username}: ${gems}`);
    };

    private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply("Profile of " + ctx.message.from.first_name + "  📌" + "\n\nThe name of the dwarven: " + user.heroName
            + "\nGems in a bag: " + user.gemsCount + "💎");
    };

    private handleSetNameCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return;
        }

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const username = `@${ctx.message.from.username}`;
        const setNameRegex = /^\/name\s+(.+)$/i;
        const setNameMatch = setNameRegex.exec(ctx.message.text || "");

        if (setNameMatch && setNameMatch[1]) {
            let setName = setNameMatch[1].trim();
            setName = setName.slice(0, 25);
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, setName, 0);
            await ctx.reply(`Cool! Now your dwarf's name is 👾 ${setName}`);
            console.log(`${username} named his dwarven --> ${setName}`);
        } else {
            await ctx.reply('Name is not specified! 💢');
            console.log(`${username} failed to change the name of his dwarven!`);
        }
    }

    private handleCommandListCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return;
        }

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply("📜List of all command:\n" +
            "\n▫Use the /name NAME_YOUR_DWARVEN command to name your dwarven. The name must not exceed 25 characters!" +
            "\n▫Use the /mine command to go to the mine." +
            "\n▫Use the /profile command to see your profile");
    }

}