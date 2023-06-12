import { Bot, CommandContext, Context } from "grammy";
import { randomInteger, randomSituationInMines } from "./utilities.js";
import { Database } from "./database/database.js";

export class GemMinerBot {

    private bot: Bot;
    private exp = 10; // Character experience gained.
    private lastCommandTime: number = 0;  // A variable that stores the time of the last execution of the command.


    constructor(token: string, private database: Database) {
        this.bot = new Bot(token);
        this.bot.command('start', this.handleStartCommand.bind(this));
        this.bot.command('name', this.handleSetNameCommand.bind(this));
        this.bot.command('help', this.handleHelpCommand.bind(this));
        this.bot.command('rules', this.handleRulesCommand.bind(this));
        this.bot.command('mine', this.handleMineCommand.bind(this));
        this.bot.command('profile', this.handleProfileCommand.bind(this));
        this.bot.command('top_money', this.handleRichestCommand.bind(this));
        this.bot.command('top_exp', this.handleExperiencedCommand.bind(this));
        this.bot.command('tops', this.handleTopsCommand.bind(this));
        this.bot.command('sell', this.handleSellCommand.bind(this));
        console.log('Bot created');
    }


    public async start(): Promise<void> {
        let date: Date = new Date();
        console.log(`Bot started [ ${ date } ]`);
        await this.bot.start();
    }


    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2 ) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ ctx.message.from.username }`;
        const message = `@${ ctx.message.from.username }, welcome to Dwarven Mines!
⛏ Here is your pickaxe, use it to /mine gems!

See /help for all available commands in the game.
✨ Good luck in the game! ✨`
        await ctx.reply(message);
        console.log(`${ username } joined the game.`);
    }


    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ ctx.message.from.username }`;
        const cooldownInSeconds = user.cooldown * 60 * 60;

        if (Date.now() - Number(user.lastMined) < user.cooldown * 60 * 60 * 1000) {
            const remainingSeconds = Math.floor(cooldownInSeconds - (Date.now() - Number(user.lastMined)) / 1000);

            if (remainingSeconds > 0) {
                const remainingHours = Math.floor(remainingSeconds / 3600);
                const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
                const remainingSecs = remainingSeconds % 60;

                await ctx.reply(`You can't mine now. Go take a rest for: <b><i>${ remainingHours }h ${ remainingMinutes }m ${ remainingSecs }s</i></b> ⏱`, { parse_mode: 'HTML' } );
            } else {
                await ctx.reply("You can't mine now. Try again later.");
            }

            return;
        }

        if (user.gemsCount == user.baglimit) {
            await ctx.reply(`‼ You are not allowed to enter the mine. There is not enough space to store the gems. Sell the gems first ‼`);
            console.log(`${ username }: reached the gems storage limit and was removed from the mine.`);
            return;
        }

        let gems = randomInteger( -5, 10 );
        const word = gems === 1 || gems === -1 ? 'gem' : 'gems';
        let messageOfMines;

        if(user.gemsCount + gems < 0) {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                gemsCount: 0,
                expCount: user.expCount + this.exp,
                lastMined: new Date() } );
            messageOfMines = randomSituationInMines(user.heroName, -user.gemsCount, this.exp);
        } else {
            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                expCount: user.expCount + this.exp,
                gemsCount: user.gemsCount + gems,
                lastMined: new Date() } );
            messageOfMines = randomSituationInMines(user.heroName, gems, this.exp);
        }

        await ctx.reply(`${ messageOfMines }`, { parse_mode: 'HTML' } );
        console.log(`${ username }: ${ gems } ${ word }, and received +${ this.exp } XP.`);

        await this.database.updateLevel(ctx ,ctx.message.from.id, ctx.message.chat.id, this.exp, username);
    }


    private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        if (user.gemsCount === user.baglimit) {
            await ctx.reply(`<b>${ user.heroName }</b> 👾\n
🎯 Level: ${ user.playerLevel }    🎮 ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount } / ${ user.baglimit }   💰 ${ user.moneyCount }\n
‼ Your bag is full. Sell gems ‼`, { parse_mode: 'HTML' } );
        } else {
            await ctx.reply(`<b>${ user.heroName }</b> 👾\n
🎯 Level: ${ user.playerLevel }    🎮 ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount } / ${ user.baglimit }   💰 ${ user.moneyCount }`,
                { parse_mode: 'HTML' } );
        }
    }


    private handleSetNameCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ctx.message.from.username}`;
        const setNameRegex = /^\/name\s+(.+)$/i;
        const setNameMatch = setNameRegex.exec(ctx.message.text || "");

        if (setNameMatch && setNameMatch[1]) {

            let name = setNameMatch[1].trim();
            name = name.slice(0, 30); 
            const setName = name.replaceAll('<', '&lt;').replaceAll('>', '&gt;');

            const existingUser = await this.database.checkUniqueName(ctx.message.chat.id, setName);
            if (existingUser) {
                await ctx.reply(`💢 Sorry, the name '${ setName }' is already taken. Think of something else!`, { parse_mode: 'HTML' } );
                console.log(`${ username } tried to set the name '${ setName }', but it was already taken.`);
                return;
            }

            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, { heroName: setName } );
            await ctx.reply(`Cool! Now your dwarf's name is <b>${ setName }</b> 👾`, { parse_mode: 'HTML' } );
            console.log(`${ username } named his dwarven --> ${ setName }`);
        } else {
            await ctx.reply('💢 Name is not specified!\n\nFormat: /name <code>NAME</code>', { parse_mode: 'HTML' } );
            console.log(`${ username } failed to change the name of his dwarven!`);
        }
    }


    private handleHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        await ctx.reply("📜 Commands list 📜\n" +
            "\n▫/rules — Rules of the game" +
            "\n▫/name <code>NAME</code> — Update dwarf name. Limit - 30 characters" +
            "\n▫/mine — Go to mine" +
            "\n▫/profile — Dwarf profile" +
            "\n▫/top_money — Rating of the richest players" +
            "\n▫/top_exp — Rating of the mosy experienced players" +
            "\n▫/tops — General rating with prize places" +
            "\n▫/sell <code>AMOUNT</code> — Exchange gems 💎 for coins 💰", { parse_mode: 'HTML' } );
    }


    private handleRulesCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        await ctx.reply("Dwarven Mines❗");
    }


    private handleRichestCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForRichest = await this.database.findAllRichestUsers(ctx.message.chat.id);
        let ratingStringsForRichest = ratingForRichest.map((player, index) => {
            let emoji = index === 0 ? '👑' : '';
            return `${ index + 1 }. ${ emoji } ${ player.heroName }  -  💎 <b>${ player.gemsCount }</b>  💰 <b>${ player.moneyCount }</b>`;
        });

        let ratingMessageForRichest = ratingStringsForRichest.length > 0 ? ratingStringsForRichest.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Richest players</b>⛏\n\n${ ratingMessageForRichest }`,{ parse_mode: 'HTML' } );
    }


    private handleExperiencedCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForExperienced = await this.database.findAllExperiencedUsers(ctx.message.chat.id);
        let ratingStringsForExperienced = ratingForExperienced.map((player, index) => {
            let emoji = index === 0 ? '👑' : '';
            return `${ index + 1 }. ${ emoji } ${ player.heroName }  -  🎯 <b>${ player.playerLevel }</b>  🎮 <b>${ player.expCount } / ${ player.newExp }</b>`;
        });

        let ratingMessageForExperienced = ratingStringsForExperienced.length > 0 ? ratingStringsForExperienced.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Most experienced players</b>⛏\n\n${ ratingMessageForExperienced }`,{ parse_mode: 'HTML' } );
    }


    private handleTopsCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        /////////////////////////////////////////////// For riches

        const limitUsers: number = 3;
        let ratingForRichest = await this.database.findAllRichestUsers(ctx.message.chat.id);
        let currentUserIndexRichest = ratingForRichest.findIndex(player => player.userId === ctx.message.from.id);
        let findCurrentUserData = ratingForRichest.find(player => player.userId === ctx.message.from.id);
        ratingForRichest = ratingForRichest.slice(0, limitUsers);
        let ratingStringsForRichest = ratingForRichest.map((player, index) => {
            let emoji = '';
            if (index === 0) {
                emoji = '🥇';
            } else if (index === 1) {
                emoji = '🥈';
            } else if (index === 2) {
                emoji = '🥉';
            }
            return `${ emoji } ${ player.heroName }  -  💎 <b>${ player.gemsCount }</b> 💰 <b>${ player.moneyCount }</b>`;
        });
        let ratingMessageForRichest = ratingStringsForRichest.length > 0 ? ratingStringsForRichest.join("\n") : "<i>‼ No players found ‼</i>";
        let currentUserPlaceRichest = currentUserIndexRichest !== -1 ?
            currentUserIndexRichest + 1 + `. You  -  💎 ${ findCurrentUserData?.gemsCount } 💰 ${ findCurrentUserData?.moneyCount }`  : '👤You - Unrated ⛔';

        /////////////////////////////////////////////// For experienced

        let ratingForExperienced = await this.database.findAllExperiencedUsers(ctx.message.chat.id);
        let currentUserIndexExperienced = ratingForExperienced.findIndex(player => player.userId === ctx.message.from.id);
        ratingForExperienced = ratingForExperienced.slice(0, limitUsers);
        let ratingStringsForExperienced = ratingForExperienced.map((player, index) => {
            let emoji = '';
            if (index === 0) {
                emoji = '🥇';
            } else if (index === 1) {
                emoji = '🥈';
            } else if (index === 2) {
                emoji = '🥉';
            }
            return `${ emoji } ${ player.heroName }  -  🎯 <b>${ player.playerLevel }</b>  🎮 <b>${ player.expCount } / ${ player.newExp }</b>`;
        });
        let ratingMessageForExperienced = ratingStringsForExperienced.length > 0 ? ratingStringsForExperienced.join("\n") : "<i>‼ No players found ‼</i>";
        let currentUserPlaceExperienced = currentUserIndexExperienced !== -1 ?
            currentUserIndexExperienced + 1 + `. You  -  🎯 ${ findCurrentUserData?.playerLevel }  🎮 ${ findCurrentUserData?.expCount } / ${ findCurrentUserData?.newExp }`  : '👤You - Unrated ⛔';

        /////////////////////////////////////////////// Out

        await ctx.reply(`⛏<b>Richest players</b>⛏\n\n${ ratingMessageForRichest } \n\n <b>${ currentUserPlaceRichest }</b>
\n\n\n⛏<b>Most experienced players</b>⛏\n\n${ ratingMessageForExperienced }\n\n <b>${ currentUserPlaceExperienced }</b>`,
            { parse_mode: 'HTML' } );
    }


    private handleSellCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 2) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const sellRegex = /^\/sell ?(-?\d+?)?$/;
        const sellMatch = sellRegex.exec(ctx.message.text || "");

        if (sellMatch && sellMatch[1]) {
            const amount = Number(sellMatch[1]);

            if (amount > user.gemsCount) {
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
            await ctx.reply(`You can exchange your 💎 for 💰 - (1 : 5)\nYour bag: <b>${ user.gemsCount }</b> 💎\n\n‼ Use /sell <code>AMOUNT</code> to sell ‼`, { parse_mode: 'HTML' } )
            console.log(`@${ ctx.message.from.username }: entered the /sell command without additional parameters`);
            return;
        }
    }

}