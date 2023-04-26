import { Bot, CommandContext, Context } from "grammy";
import { randomInteger } from "./utilities.js";
import { Database } from "./database/database.js";

export class GemMinerBot {

    private bot: Bot;
    private cooldown = 0.1;   // Minutes.
    private bagLimit = 100;   // Replace

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
        const message = `@${ ctx.message.from.username }, welcome to Dwarven Mines!
⛏ Here is your pickaxe, use it to /mine gems!

See /help for all available commands in the game.
✨ Good luck in the game! ✨`
        await ctx.reply(message);
    }

    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const username = `@${ ctx.message.from.username }`;

        if (user.gemsCount === this.bagLimit){
            await ctx.reply(`You are not allowed to enter the mine. There is not enough space to store the gems. Sell the gems first`);
            console.log(`${ username }: reached the gems storage limit and was removed from the mine.`);
            return;
        }

        if( Date.now() - Number(user.lastMined) < this.cooldown * 60_000 ){
            await ctx.reply("You can't mine now. Try again in " + Math.floor(this.cooldown * 60 - (Date.now() - Number(user.lastMined)) / 1000) + " sec")
            return;
        }

        let gems = randomInteger(-5, 10);
        const word = gems === 1 || gems === -1 ? 'gem' : 'gems';
        const exp: number = 10; // Replace
        let message: string;

        if (gems < 0) {
            message = `${ username }, you lost ${ -gems } ${ word } 💎. But you got +${ exp } exp 🎮`;
        } else if (gems === 0) {
            message = `${ username }, you got nothing. But you got +${ exp } exp 🎮`;
        } else {
            if (user.gemsCount + gems >= this.bagLimit) {
                gems = this.bagLimit - user.gemsCount
                message = `${ username }, you got ${ gems } ${ word } 💎. And you got +${ exp } exp 🎮 . \n\n❌ Your bag is full. Sell gems!`;
            } else {
                message = `${ username }, you got ${ gems } ${ word } 💎. And you got +${ exp } exp 🎮`;
            }
        }

        if(user.gemsCount + gems < 0) {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, { gemsCount: 0 } );
        } else {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                expCount: user.expCount + exp,
                gemsCount: user.gemsCount + gems,
                lastMined: new Date(0) } );
        }

        await ctx.reply(message);
        console.log(`${ username }: ${ gems } gems, and received +${ exp } exp.`);

        await this.database.updateLevel(ctx ,ctx.message.from.id, ctx.message.chat.id, exp);
    }

    private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        if (user.gemsCount === 100) {
            await ctx.reply(`<b>${ user.heroName }</b> \n
🏅 Level: ${ user.playerLevel }    🎮 ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount }   💰 ${ user.moneyCount }\n
‼ Your bag is full. Sell gems!`, { parse_mode: 'HTML' } );
        } else {
            await ctx.reply(`<b>${ user.heroName }</b> \n
🏅 Level: ${ user.playerLevel }    🎮 ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount }   💰 ${ user.moneyCount }`,
                { parse_mode: 'HTML' } );
        }
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

            let name = setNameMatch[1].trim();
            name = name.slice(0, 25);
            const setName = name.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

            const existingUser = await this.database.checkUniqueName(ctx.message.chat.id, setName);
            if (existingUser) {
                await ctx.reply(`💢 Sorry, the name '${ setName }' is already taken. Think of something else!`, { parse_mode: 'HTML' } );
                console.log(`${ username } tried to set the name '${ setName }', but it was already taken.`);
                return;
            }

            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, { heroName: setName });
            await ctx.reply(`Cool! Now your dwarf's name is <b>${ setName }</b> 👾`, { parse_mode: 'HTML' } );
            console.log(`${ username } named his dwarven --> ${ setName }`);
        } else {
            await ctx.reply('💢 Name is not specified!\nFormat: /name NAME');
            console.log(`${ username } failed to change the name of his dwarven!`);
        }
    }

    private handleHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }
        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        await ctx.reply("📜 Commands list 📜\n" +
            "\n▫/name NAME — Update dwarf name. Limit - 25 characters" +
            "\n▫/mine — Go to mine" +
            "\n▫/profile — Dwarf profile" +
            "\n▫/rating — Chat ranking" +
            "\n▫/sell — exchange gems 💎 for coins 💰");
    }

    private handleRatingCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }

        const rating = await this.database.findAllUsers(ctx.message.chat.id);
        const ratingStrings = rating.map((player, index) => {
            const emoji = index === 0 ? '👑' : '';
            return `${ index + 1 }. ${ player.heroName } ${ emoji }  -  💎 <b>${ player.gemsCount }</b>  💰 <b>${ player.moneyCount }</b>`;
        });

        const ratingMessage = ratingStrings.length > 0 ? ratingStrings.join("\n") : "<i>No players found!</i>";
        await ctx.reply(`⛏<b>Top miners</b>⛏\n\n${ ratingMessage }`, { parse_mode: 'HTML' } );
    }

    private handleSellCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5){
            return;
        }

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const sellRegex = /^\/sell ?(-?\d+?)?$/;
        const sellMatch = sellRegex.exec(ctx.message.text || "");

        if (sellMatch && sellMatch[1]) {
            const amount = Number(sellMatch[1]);

            if (amount > user.gemsCount){
                await ctx.reply(`💢 You have less gems to exchange than you should!`);
                console.log(`@${ctx.message.from.username}: tried to exchange more gems than he has`);
                return;
            }  else if (amount <= 0 || isNaN(amount) ) {
                await ctx.reply(`💢 You have entered an invalid value for selling gems! \nEnter another value!`)
                console.log(`@${ctx.message.from.username}: entered an invalid value for selling gems.`);
                return;
            } else if (sellMatch[1] === undefined) {
                return;
            } else {
                const coins = amount * 5;
                await ctx.reply(`You sold <b>${ amount }</b> 💎 and received <b>${ coins }</b> 💰`, { parse_mode: 'HTML' } );
                console.log(`@${ ctx.message.from.username }: sold ${ amount } gems -> ${ coins } coins`);
                await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                    gemsCount: user.gemsCount - amount,
                    moneyCount: user.moneyCount + coins } );
            }
        } else {
            await ctx.reply(`You can exchange your 💎 for 💰 - (1 : 5)\nYour bag: <b>${ user.gemsCount }</b> 💎\n\nUse /sell <code>AMOUNT</code> to sell`, { parse_mode: 'HTML' } )
            console.log(`@${ ctx.message.from.username }: entered the /sell command without additional parameters`);
            return;
        }
    }


}