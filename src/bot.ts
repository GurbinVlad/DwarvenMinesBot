import { Bot, CommandContext, Context } from "grammy";
import { randomInteger, randomSituationInMines } from "./utilities.js";
import { Database } from "./database/database.js";
import { Migrations } from "./database/migrations.js";

export class GemMinerBot {

    private bot: Bot;
    private lastCommandTime: number = 0;
    private lvlArr: number[] = [ 20, 50, 90, 150, 230, 340, 450, 560, 670, 780 ];


    constructor( token: string, private database: Database, private migrations: Migrations ) {
        this.bot = new Bot( token );
        this.bot.command('start', this.handleStartCommand.bind( this ) );
        this.bot.command('name', this.handleSetNameCommand.bind( this ) );
        this.bot.command('help', this.handleHelpCommand.bind( this ) );
        this.bot.command('rules', this.handleRulesCommand.bind( this ) );
        this.bot.command('mine', this.handleMineCommand.bind( this ) );
        this.bot.command('profile', this.handleProfileCommand.bind( this ) );
        this.bot.command('top_money', this.handleRichestCommand.bind( this ) );
        this.bot.command('top_exp', this.handleExperiencedCommand.bind( this ) );
        this.bot.command('tops', this.handleTopsCommand.bind( this ) );
        this.bot.command('sell', this.handleSellCommand.bind( this ) );
        console.log('Bot created');
    }


    public async start(): Promise<void> {
        let date: Date = new Date();
        console.log(`Bot started [ ${ date } ]`);
        await this.migrations.migrate();
        await this.bot.start();
    }


    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1 ) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ ctx.message.from.username }`;
        const message = `@${ ctx.message.from.username }, welcome to Dwarven Mines!

⛏ Here is your pickaxe, use it to gain not only riches, but also fame!

See /help for all available commands in the game.

✨ Good luck in the game! ✨`
        await ctx.reply( message );
        console.log(`${ username } joined the game.`);
    }


    private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ ctx.message.from.username }`;
        const cooldownInSeconds = user.cooldown * 3600;

        if (Date.now() - Number(user.lastMined) < user.cooldown * 3600 * 1000) {
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

        let gems: number;
        let exp: number;

        if ( user.playerLevel >= 10 ) {
            gems = randomInteger( -5, 15 );
            exp = randomInteger( 20, 25 );
        } else if ( user.playerLevel >= 5 ) {
            gems = randomInteger( -5, 12 );
            exp = randomInteger( 10, 20 );
        } else {
            gems = randomInteger( -5, 10 );
            exp = randomInteger( 5, 10 );
        }

        let word = gems === 1 || gems === -1 ? 'gem' : 'gems';
        let messageOfMines;

        if( user.gemsCount + gems < 0 ) {

                await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                    gemsCount: 0,
                    expCount: user.expCount + exp,
                    lastMined: new Date()
                } );

                messageOfMines = randomSituationInMines(user.heroName, -user.gemsCount, exp);
                console.log(`${ username }: ${ -user.gemsCount } ${ word }, and received +${ exp } XP.`);
                await ctx.reply(`${ messageOfMines }`, { parse_mode: 'HTML' } );

        } else if ( user.gemsCount + gems > user.baglimit ) {

            await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                gemsCount: user.baglimit,
                expCount: user.expCount + exp,
                lastMined: new Date()
            } );

            messageOfMines = randomSituationInMines( user.heroName, ( user.baglimit - user.gemsCount ), exp );
            console.log(`${ username }: ${ gems } ${ word }, and received +${ exp } XP.`);
            await ctx.reply(`${ messageOfMines }`, { parse_mode: 'HTML' } );

        } else {
                await this.database.updateUser( ctx.message.from.id, ctx.message.chat.id, {
                    gemsCount: user.gemsCount + gems,
                    expCount: user.expCount + exp,
                    lastMined: new Date()
                } );

                messageOfMines = randomSituationInMines( user.heroName, gems, exp );
                console.log(`${ username }: ${ gems } ${ word }, and received +${ exp } XP.`);
                await ctx.reply(`${ messageOfMines }`, { parse_mode: 'HTML' } );

        }

        await this.database.ifUpdateLevel( ctx ,ctx.message.from.id, ctx.message.chat.id, this.lvlArr );
    }


    private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        if ( user.gemsCount === user.baglimit ) {
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
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const username = `@${ ctx.message.from.username }`;
        const setNameRegex = /^\/name(@DwarvenMinesBot)?\s+(.+)$/;
        const setNameMatch = setNameRegex.exec(ctx.message.text || "");

        if ( setNameMatch && setNameMatch[2] ) {

            let name = setNameMatch[2].trim();
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
        if (currentTime - this.lastCommandTime < 1) {
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
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        await ctx.reply("<b><i>Rules for game</i></b> \n" +
            "\n" +
            "<i>Hey! Are you our new mine explorer?</i> \n" +
            "<i>Perfect! Let me explain you some details:</i> \n" +
            "\n" +
            "1️⃣ Our mines are full of different gems 💎, so you can try to find them all! 😁 \n" +
            "2️⃣ Mining - is a dangerous activity ☠️. You must to be careful, if you don`t want to lost all your gems 🙃 \n" +
            "3️⃣ Do not forget to sell your new gems!☝️ I know, that you`re very strong dwarf, but your backpack isn`t as good as you... 😅 \n" +
            "4️⃣ Mines are very tiring, i know. At first, you will mine only once a day, but who knows, how enduring will you be?🤔 \n" +
            "\n" +
            "I think there are the most important things you should know. Good luck! Oh, one request: please, try not to die... 🙂",
            { parse_mode: 'HTML' } );
    }


    private handleRichestCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
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
        if (currentTime - this.lastCommandTime < 1) {
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
        if (currentTime - this.lastCommandTime < 1) {
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
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const sellRegex = /^\/sell\s+(-?\d+?)?$/;
        const sellMatch = sellRegex.exec(ctx.message.text || "");

        if ( sellMatch && sellMatch[1] ) {

            let amount = Number( sellMatch[1] );

            if (amount > user.gemsCount) {

                await ctx.reply(`💢 You have less gems to exchange than you should!`);
                console.log(`@${ ctx.message.from.username }: tried to exchange more gems than he has`);
                return;

            }  else if (amount <= 0 || isNaN(amount) ) {

                await ctx.reply(`💢 You have entered an invalid value for selling gems! \n\nEnter another value!`)
                console.log(`@${ ctx.message.from.username }: entered an invalid value for selling gems.`);
                return;

            } else if (sellMatch[1] === undefined) {
                return;
            } else {

                let coins = amount * 5;

                await ctx.reply(`You sold <b>${ amount }</b> 💎 and received <b>${ coins }</b> 💰`, { parse_mode: 'HTML' } );
                console.log(`@${ ctx.message.from.username }: sold ${ amount } gems -> ${ coins } coins`);

                await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
                    gemsCount: user.gemsCount - amount,
                    moneyCount: user.moneyCount + coins } );
            }

        } else {
            await ctx.reply(`You can exchange your 💎 for 💰 (1 : 5)\nYour bag: <b>${ user.gemsCount }</b> 💎\n\n‼ Use: /sell <code>AMOUNT</code> to sell ‼`, { parse_mode: 'HTML' } )
            console.log(`@${ ctx.message.from.username }: entered the /sell command without additional parameters`);
            return;
        }
    }
}