import {Bot, CommandContext, Context } from "grammy";
import {randomInteger} from "./utilities.js";
import {Database} from "./database/database.js";

export class GemMinerBot {
    private bot: Bot;
    private cooldown = 1;   // Minutes.

    constructor(token: string, private database:Database) {
        this.bot = new Bot(token);
        this.bot.command('start', this.handleStartCommand.bind(this));
        this.bot.command('name', this.handleSetNameCommand.bind(this));
        this.bot.command('help', this.handleHelpCommand.bind(this));
        this.bot.command('mine', this.handleMineCommand.bind(this));
        this.bot.command('profile', this.handleProfileCommand.bind(this));
        this.bot.command('rating', this.handleRatingCommand.bind(this));
        this.bot.command('sell', this.handleSellCommand.bind(this));
        console.log('Bot created');
    }

    public async start(): Promise<void> {
        console.log('Bot started');
        await this.bot.start();
    }

    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const message = `@${ctx.message.from.username}, welcome to Dwarven mines!
Use /command_list to see all available commands in the game. Good luck in the game!✨`
        await ctx.reply(message);
    }

    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
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
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply(user.heroName
            + "⛏\n\n" + "💎 " + user.gemsCount + "   💰 " + user.moneyCount);
    };

    private handleSetNameCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const username = `@${ctx.message.from.username}`;
        const setNameRegex = /^\/name\s+(.+)$/i;
        const setNameMatch = setNameRegex.exec(ctx.message.text || "");

        if (setNameMatch && setNameMatch[1]) {
            let setName = setNameMatch[1].trim();
            setName = setName.slice(0, 25);

            // Checking for the existence of a similar name in the database
            const existingUsers = await this.database.CheckUniqueName(ctx.message.chat.id, setName);
            if (existingUsers) {
                await ctx.reply(`Sorry, the name '${setName}' is already taken. Think of something else! 💢`);
                console.log(`${username} tried to set the name '${setName}', but it was already taken.`);
                return;
            }
            //
            
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, setName, 0);
            await ctx.reply(`Cool! Now your dwarf's name is ${setName} 👾`);
            console.log(`${username} named his dwarven --> ${setName}`);
        } else {
            await ctx.reply('Name is not specified! 💢');
            console.log(`${username} failed to change the name of his dwarven!`);
        }
    }

    private handleHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply("📜List of all command:\n" +
            "\n▫/name NAME_YOUR_DWARVEN command to name your dwarven. The name must not exceed 25 characters!" +
            "\n▫/mine command to go to the mine." +
            "\n▫/profile command to see your profile" +
            "\n▫/rating command to display the rating of all players in the chat" +
            "\n▫/sell command to sell your gems💎 and receive money💰");
    }

    // Command /rating
    private handleRatingCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        const rating = await this.database.findAllUsers(ctx.message.chat.id);
        const ratingStrings = rating.map((player, index) => {
            const emoji = index === 0 ? '👑' : '';
            return `${index + 1}. ${player.heroName} ${emoji}  -  💎${player.gemsCount}  💰${player.moneyCount}`;
        });

        const ratingMessage = ratingStrings.length > 0 ? ratingStrings.join("\n") : "No players found";
        await ctx.reply(`🔥 Player rating: 🔥\n\n${ratingMessage}`);
    }
    //

    private handleSellCommand = async (ctx: CommandContext<Context>):Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        if(user.gemsCount === 0) {
            await ctx.reply(`You have no gems💎 to sell.`);
            return;
        }
        const coins = user.gemsCount*5;
        await ctx.reply(`You sold ${user.gemsCount}💎 and received ${coins}💰.`);
        console.log(`@${ctx.message.from.username}: ${user.gemsCount} gems -> ${coins} coins`);
        await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, user.heroName, 0, coins);
    }


}