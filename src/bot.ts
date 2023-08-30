import {Bot, CallbackQueryContext, CommandContext, Context } from "grammy";
import { randomInteger, randomSituationInMines } from "./utilities.js";
import { Database } from "./database/database.js";


export class GemMinerBot {

    private bot: Bot;
    private lastCommandTime: number = 0;
    private lvlArr: number[] = [ 20, 50, 90, 150, 230, 340, 450, 560, 670, 780 ];


    constructor( token: string, private database: Database) {
        this.bot = new Bot( token );
        this.bot.command('start', this.handleStartCommand.bind( this ) );
        this.bot.command('help', this.handleHelpCommand.bind( this ) );
        this.bot.command('rules', this.handleRulesCommand.bind( this ) );
        this.bot.command('profile', this.handleProfileCommand.bind( this ) );
        this.bot.command('name', this.handleSetNameCommand.bind( this ) );
        this.bot.command('mine', this.handleMineCommand.bind( this ) );
        this.bot.command('top_help', this.handleTopHelpCommand.bind( this ) );
        this.bot.command('top_money', this.handleRichestCommand.bind( this ) );
        this.bot.command('top_exp', this.handleExperiencedCommand.bind( this ) );
        this.bot.command('top_senders', this.handleTopSendCommand.bind( this ) );
        this.bot.command('top_receivers', this.handleTopReceiptCommand.bind( this ) );
        this.bot.command('tops', this.handleTopsCommand.bind( this ) );
        this.bot.command('tops_transfer', this.handleTopsTransferCommand.bind( this ) );
        this.bot.command('sell', this.handleSellCommand.bind( this ) );
        this.bot.command('send', this.handleSendCommand.bind( this ) );
        this.bot.command('grow', this.handleGrowCommand.bind( this ) );

        this.bot.callbackQuery(/(confirm|cancel)~\d+~\d+~[A-Za-z0-9_]+~(-)?\d+~\d+~\d+~\d+/, this.handlePaymentConfirmClick.bind( this ) );

        console.log('Bot created');

    }


    public async start(): Promise<void> {
        let date: Date = new Date();
        console.log(`Bot started [ ${ date } ]`);
        await this.bot.start();
    }


    private handleGrowCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return ;
        }

        if (ctx.message.from?.username) {
            await ctx.reply(` @${ ctx.message.from.username } 👇 👇 👇\n\n🐷🐖🐖🐷 ⚠ NO PIGS!!! ⚠ 🐷🐖🐖🐷
\n\nBetter use "/mine" command!`);
            await ctx.replyWithSticker('CAACAgIAAxkBAAEO875k5delH0FE8AABWMZQfleZP65HVR4AAqYWAAKcVxFKW3flXLipYvcwBA');
        } else {
            if (ctx.message.from?.last_name) {
                await ctx.reply(`${ ctx.message.from.first_name } ${ ctx.message.from.last_name } 👇 👇 👇\n\n🐷🐖🐖🐷 ⚠ NO PIGS!!! ⚠ 🐷🐖🐖🐷
\n\nBetter use "/mine" command!`);
                await ctx.replyWithSticker('CAACAgIAAxkBAAEO875k5delH0FE8AABWMZQfleZP65HVR4AAqYWAAKcVxFKW3flXLipYvcwBA');
            } else {
                await ctx.reply(`${ ctx.message.from.first_name } 👇 👇 👇\n\n🐷🐖🐖🐷 ⚠ NO PIGS!!! ⚠ 🐷🐖🐖🐷
\n\nBetter use "/mine" command!`);
                await ctx.replyWithSticker('CAACAgIAAxkBAAEO875k5delH0FE8AABWMZQfleZP65HVR4AAqYWAAKcVxFKW3flXLipYvcwBA');
            }
        }

        return;
    }


    private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined) {
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
        if(ctx.message === undefined) {
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
            gems = randomInteger( -7, 12 );
            exp = randomInteger( 10, 20 );
        } else {
            gems = randomInteger( -9, 10 );
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
        if(ctx.message === undefined) {
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
🏅 Level: ${ user.playerLevel }     ⭐️ ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount } / ${ user.baglimit }   💰 ${ user.moneyCount }\n
‼ Your bag is full. Sell gems ‼`, { parse_mode: 'HTML' } );
        } else {
            await ctx.reply(`<b>${ user.heroName }</b> 👾\n
🏅Level: ${ user.playerLevel }    ⭐️ ${ user.expCount } / ${ user.newExp } \n\n💎 ${ user.gemsCount } / ${ user.baglimit }   💰 ${ user.moneyCount }`,
                { parse_mode: 'HTML' } );
        }
    }


    private handleSetNameCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined) {
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
        /*if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }*/

        if(ctx.message === undefined) {
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
            "\n▫/top_help — list of accessible commands for rating with a brief description" +
            "\n▫/sell <code>AMOUNT</code> — Exchange gems 💎 for coins 💰 (/sell for info)" +
            "\n▫/send <code>AMOUNT</code> — Transfer 💰 to other players (/send for info)"
            , { parse_mode: 'HTML' } );
    }


    private handleTopHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {

        if(ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        await ctx.reply("📜 List commands for rating 📜\n" +
            "\n▫/top_money — Rating of the richest players" +
            "\n▫/top_exp — Rating of the mosy experienced players" +
            "\n▫/top_senders — Sender rating" +
            "\n▫/top_receivers — Recipient rating" +
            "\n▫/tops — Overall rating with money and experience prizes" +
            "\n▫/tops_transfer — Overall rating with prizes for the best senders and recipients"
        );


    }


    private handleRulesCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined) {
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
        if (ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForRichest = await this.database.findAllRichestPlayers(ctx.message.chat.id);
        let ratingStringsForRichest = ratingForRichest.map((player, index) => {
            let emoji = index === 0 ? '👑' : '';
            return `${ index + 1 }.${ emoji } ${ player.heroName }  -  💎 <b>${ player.gemsCount }</b>  💰 <b>${ player.moneyCount }</b>`;
        });

        let ratingMessageForRichest = ratingStringsForRichest.length > 0 ? ratingStringsForRichest.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Richest players</b>⛏\n\n${ ratingMessageForRichest }`,{ parse_mode: 'HTML' } );
    }


    private handleExperiencedCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForExperienced = await this.database.findAllExperiencedPlayers(ctx.message.chat.id);
        let ratingStringsForExperienced = ratingForExperienced.map( (player, index) => {
            let emoji = index === 0 ? '👑' : '';
            return `${ index + 1 }.${ emoji } ${ player.heroName }  -  🏅 <b>${ player.playerLevel }</b>  ⭐️ <b>${ player.expCount } / ${ player.newExp }</b>`;
        });

        let ratingMessageForExperienced = ratingStringsForExperienced.length > 0 ? ratingStringsForExperienced.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Most experienced players</b>⛏\n\n${ ratingMessageForExperienced }`,{ parse_mode: 'HTML' } );
    }


    private handleTopsCommand = async (ctx: CommandContext<Context>): Promise<void> => {

        if(ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const limitUsers: number = 3;

        /////////////////////////////////////////////// For riches

        let ratingForRichest = await this.database.findAllRichestPlayers(ctx.message.chat.id);
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

        let ratingForExperienced = await this.database.findAllExperiencedPlayers(ctx.message.chat.id);
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
            return `${ emoji } ${ player.heroName }  -  🏅 <b>${ player.playerLevel }</b>  ⭐️ <b>${ player.expCount } / ${ player.newExp }</b>`;
        });

        let ratingMessageForExperienced = ratingStringsForExperienced.length > 0 ? ratingStringsForExperienced.join("\n") : "<i>‼ No players found ‼</i>";
        let currentUserPlaceExperienced = currentUserIndexExperienced !== -1 ?
            currentUserIndexExperienced + 1 + `. You  -  🏅 ${ findCurrentUserData?.playerLevel }  ⭐️ ${ findCurrentUserData?.expCount } / ${ findCurrentUserData?.newExp }`  : '👤You - Unrated ⛔';

        /////////////////////////////////////////////// Out

        await ctx.reply(`⛏<b>Richest players</b>⛏\n\n${ ratingMessageForRichest } \n\n <b>${ currentUserPlaceRichest }</b>
\n\n\n⛏<b>Most experienced players</b>⛏\n\n${ ratingMessageForExperienced }\n\n <b>${ currentUserPlaceExperienced }</b>`,
            { parse_mode: 'HTML' } );

    }


    private handleTopSendCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForGenerous = await this.database.findAllTheMostGenerousPlayers(ctx.message.chat.id);
        let ratingStringsForGenerous = ratingForGenerous.map( (player, index) => {
            let emoji = index === 0 ? '🤑' : '';
            return `${ index + 1 }.${ emoji } ${ player.heroName }  -  <b>${ player.amountOfSentCoins }</b>💰 <b>(${ player.counterOfSentCoins })</b>`;
        });

        let ratingMessageForGenerous = ratingStringsForGenerous.length > 0 ? ratingStringsForGenerous.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Top senders</b>⛏\n\n${ ratingMessageForGenerous }`,{ parse_mode: 'HTML' } );
    }


    private handleTopReceiptCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if (ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        let ratingForHappiest = await this.database.findAllTheHappiestPlayers(ctx.message.chat.id);
        let ratingStringsForHappiest = ratingForHappiest.map( (player, index) => {
            let emoji = index === 0 ? '💸' : '';
            return `${ index + 1 }.${ emoji } ${ player.heroName }  -  <b>${ player.amountOfReceivedCoins }</b>💰 <b>(${ player.counterOfReceivedCoins })</b>`;
        } );

        let ratingMessageForHappiest = ratingStringsForHappiest.length > 0 ? ratingStringsForHappiest.join("\n") : "<i>‼ No players found ‼</i>";

        await ctx.reply(`⛏<b>Top recipients</b>⛏\n\n${ ratingMessageForHappiest }`,{ parse_mode: 'HTML' } );
    }


    private handleTopsTransferCommand = async (ctx: CommandContext<Context>): Promise<void> => {

        if(ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);
        const limitUsers: number = 3;

        /////////////////////////////////////////////// For senders

        let ratingForSenders = await this.database.findAllTheMostGenerousPlayers(ctx.message.chat.id);
        let findCurrentUserData = ratingForSenders.find(player => player.userId === ctx.message.from.id);
        let currentUserIndexSenders = ratingForSenders.findIndex(player => player.userId === ctx.message.from.id);
        ratingForSenders = ratingForSenders.slice(0, limitUsers);
        let ratingStringsForSenders = ratingForSenders.map((player, index) => {
            let emoji = '';
            if (index === 0) {
                emoji = '🥇';
            } else if (index === 1) {
                emoji = '🥈';
            } else if (index === 2) {
                emoji = '🥉';
            }
            return `${ emoji } ${ player.heroName }  -  <b>${ player.amountOfSentCoins }</b>💰  <b>(${ player.counterOfSentCoins })</b>`;
        });

        let ratingMessageForSenders = ratingStringsForSenders.length > 0 ? ratingStringsForSenders.join("\n") : "<i>‼ No players found ‼</i>";
        let currentUserPlaceSenders = currentUserIndexSenders !== -1 ?
            currentUserIndexSenders + 1 + `. You  -  ${ findCurrentUserData?.amountOfSentCoins }💰  ${ findCurrentUserData?.counterOfSentCoins }`  : '👤You - Unrated ⛔';

        /////////////////////////////////////////////// For receivers

        let ratingForReceivers = await this.database.findAllTheHappiestPlayers(ctx.message.chat.id);
        let currentUserIndexReceivers = ratingForReceivers.findIndex(player => player.userId === ctx.message.from.id);
        ratingForReceivers = ratingForReceivers.slice(0, limitUsers);
        let ratingStringsForReceivers = ratingForReceivers.map((player, index) => {
            let emoji = '';
            if (index === 0) {
                emoji = '🥇';
            } else if (index === 1) {
                emoji = '🥈';
            } else if (index === 2) {
                emoji = '🥉';
            }
            return `${ emoji } ${ player.heroName }  -  <b>${ player.amountOfReceivedCoins }</b>💰  <b>(${ player.counterOfReceivedCoins })</b>`;
        });

        let ratingMessageForReceivers = ratingStringsForReceivers.length > 0 ? ratingStringsForReceivers.join("\n") : "<i>‼ No players found ‼</i>";
        let currentUserPlaceReceivers = currentUserIndexReceivers !== -1 ?
            currentUserIndexReceivers + 1 + `. You  -  ${ findCurrentUserData?.amountOfReceivedCoins }💰  ${ findCurrentUserData?.counterOfReceivedCoins }`  : '👤You - Unrated ⛔';

        /////////////////////////////////////////////// Out

        await ctx.reply(`⛏<b>Top senders</b>⛏\n\n${ ratingMessageForSenders } \n\n <b>${ currentUserPlaceSenders }</b>
\n\n\n⛏<b>Top recipients</b>⛏\n\n${ ratingMessageForReceivers }\n\n <b>${ currentUserPlaceReceivers }</b>`,
            { parse_mode: 'HTML' } );

    }


    private handleSellCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined) {
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


    private handleSendCommand = async (ctx: CommandContext<Context>): Promise<void> => {
        if(ctx.message === undefined) {
            return;
        }

        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastCommandTime < 1) {
            return;
        }
        this.lastCommandTime = currentTime;

        const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id);

        const sendRegex = /^\/send\s+(-?\d+?)?$/;
        const sendMatch = sendRegex.exec(ctx.message.text || "");

        const recipient = ctx.message.reply_to_message?.from?.id;
        const chatId = ctx.message.chat.id;

        let transferTimer: number;
        let transferTimerText: string;
        if (user.playerLevel > 10 && user.playerLevel < 20) {
            transferTimer = 0.5;
            transferTimerText = `<b>1</b> transfer within <b>30</b> minutes ⏱`;
        } else {
            transferTimer = 1;
            transferTimerText = `no more than <b>1</b> transfer per hour ⏱`;
        }
        let cooldownInSeconds = transferTimer * 3600;

        if (!recipient) {
            await ctx.reply(`You can send money 💰 to other players using 🛖 <b>Dwarven Bank.</b>
Use "/send <code>AMOUNT</code>" command in reply to a message to make a transfer.\n\n` +
                `⚠ Service fees:\n` +
                `▫Less than 100💰 ⇒ <b>1💰 + 2%</b>\n` +
                `▫100 to 200💰 ⇒ <b>1%</b>\n` +
                `▫200💰 and more ⇒ <b>0.5%</b>` +
                `\n\n⚠ Minimal transfer is <b>5💰</b>` +
                `\n⚠ Transfer limit - ${ transferTimerText }`
                , { parse_mode: 'HTML' } );
            return;
        }

        if ( sendMatch && sendMatch[1] ) {

            let amount = Number( sendMatch[1] );
            let amountWithCommission = amount;
            let commission: number;
            /// let word = amount === 1 || amount === -1 ? 'coin' : 'coins';

            let ensurePlayerExists = await this.database.ensurePlayerExists(recipient, chatId);

            if (amount < 100) {
                commission = Math.floor(1 + (amount * 2 / 100) );
                amountWithCommission += Math.floor(1 + (amount * 2 / 100) );
            } else if (amount >= 100 && amount < 200) {
                commission = Math.floor(amount / 100);
                amountWithCommission += Math.floor(amount / 100);
            } else {
                commission = Math.floor(amount * 0.5 / 100);
                amountWithCommission += Math.floor(amount * 0.5 / 100);
            }

            if (recipient == ctx.message.from.id) {
                await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${user.heroName}</b> 👾\nAmount: <b>${amount}💰</b>\nService fee: <b>${commission}💰</b>
To pay: <b>${amountWithCommission}</b>💰\n\n<b>Reason: <u>Transferring itself is impossible</u></b>`, {parse_mode: 'HTML'});
                return;
            }

            if (ensurePlayerExists === null) {

                await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${ user.heroName }</b> 👾
Receiver: <b>unknown</b>\nAmount: <b>${ amount }💰</b>\nService fee: <b>${ commission }💰</b>
To pay: <b>${ amountWithCommission }</b>💰\n\n<b>Reason: <u>Receiver not found</u></b>`, { parse_mode: 'HTML' } );
                console.log(`@${ ctx.message.from.username } made a transfer of coins to a non-existent player`);
                return;
            } else {

                if (amountWithCommission > user.moneyCount) {

                    await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}💰</b>\nService fee: <b>${commission}💰</b>
To pay: <b>${amountWithCommission}</b>💰\n\n<b>Reason: <u>Not enough money</u></b>`, {parse_mode: 'HTML'});
                    console.log(`@${ctx.message.from.username} wanted to send more coins than he has`);
                    return;

                } else if (amount > 0 && amount < 5) {

                    await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}💰</b>\nService fee: <b>${commission}💰</b>
To pay: <b>${amountWithCommission}</b>💰\n\n<b>Reason: <u>Minimal transfer amount is 5💰</u></b>`, {parse_mode: 'HTML'});
                    return;

                } else if (amount <= 0 || isNaN(amount)) {

                    await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}💰</b>\nService fee: <b>${commission}💰</b>
To pay: <b>${amountWithCommission}</b>💰\n\n<b>Reason: <u>Invalid amount</u></b>`, {parse_mode: 'HTML'});
                    console.log(`@${ctx.message.from.username} entered an invalid value for transferring coins!`);
                    return;

                }

                if (Date.now() - Number(user.lastSend) < transferTimer * 3600 * 1000) {
                    const remainingSeconds = Math.floor(cooldownInSeconds - (Date.now() - Number(user.lastSend)) / 1000);

                    if (remainingSeconds > 0) {
                        const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
                        const remainingSecs = remainingSeconds % 60;

                        await ctx.reply(`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}💰</b>\nService fee: <b>${commission}💰</b>
To pay: <b>${amountWithCommission}</b>💰\n\n<b>Reason: <u>Transfer limit exceeded</u></b>\nTry again in: <b><i>${remainingMinutes}m ${remainingSecs}s</i></b> ⏱`,
                            {parse_mode: 'HTML'});
                    } else {
                        await ctx.reply("⚠️ Transfer limit exceeded! ⚠️");
                    }
                    return;
                }

                const senderId = ctx.from.id;
                const receiverId = ctx.message.reply_to_message?.from?.id;
                const receiverUserName = ctx.message.reply_to_message?.from?.username;

                await ctx.reply(`⚜ PAYMENT ⚜\n--------------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>${ensurePlayerExists.heroName}</b> 👾
Amount: <b>${amount}💰</b>\nService fee: <b>${commission}</b>💰\nTo pay: <b>${amountWithCommission}</b>💰\n\nConfirm transfer?`, {
                    reply_markup: {
                        inline_keyboard: [
                            [ {
                                text: 'YES 🟢',
                                callback_data: `confirm~${senderId}~${receiverId}~${receiverUserName}~${chatId}~${amount}~${commission}~${amountWithCommission}`,
                            }, {
                                text: 'NO 🔴',
                                callback_data: `cancel~${senderId}~${receiverId}~${receiverUserName}~${chatId}~${amount}~${commission}~${amountWithCommission}`
                            } ]
                        ]
                    },
                    parse_mode: 'HTML'
                } );

            }

        } else {

            await ctx.reply(`You can send money 💰 to other players using 🛖 <b>Dwarven Bank.</b>
Use "/send <code>AMOUNT</code>" command in reply to a message to make a transfer.\n\n` +
                `⚠ Service fees:\n` +
                `▫Less than 100💰 ⇒ <b>1💰 + 2%</b>\n` +
                `▫100 to 200💰 ⇒ <b>1%</b>\n` +
                `▫200💰 and more ⇒ <b>0.5%</b>` +
                `\n\n⚠ Minimal transfer is <b>5💰</b>` +
                `\n⚠️ Transfer limit - ${ transferTimerText }`
                , { parse_mode: 'HTML' } );
            return;
        }
    }


    private handlePaymentConfirmClick = async (ctx: CallbackQueryContext<Context>) => {

        const callbackQueryUser = ctx.callbackQuery.from.id;
        const data = ctx.callbackQuery.data;

        if (!data) {
            return;
        }

        const [buttonId, senderId,receiverId, receiverUserName, chatId,
            amount, commission, amountWithCommission] = data.split('~');

        const user = await this.database.getOrCreateUser(callbackQueryUser, Number(chatId) );
        const ensurePlayerExists = await this.database.ensurePlayerExists(Number(receiverId), Number(chatId) );

        if (ensurePlayerExists === null) {
            return;
        }

        if (callbackQueryUser !== Number(senderId) ) {
            await ctx.answerCallbackQuery( {
                text: '❌ Access denied ❌'
            } );
            return;
        }

        switch (buttonId) {

            case 'confirm': {
                await ctx.answerCallbackQuery( {
                    text: `✅ SENT ✅`,
                    show_alert: true
                } );

                await this.database.updateUser(callbackQueryUser, Number(chatId), {
                    moneyCount: user.moneyCount - Number(amountWithCommission),
                    lastSend: new Date(),
                    counterOfSentCoins: user.counterOfSentCoins + 1,
                    amountOfSentCoins: user.amountOfSentCoins + Number(amount)
                } );

                await this.database.updateUser(Number(receiverId), Number(chatId), {
                    moneyCount: ensurePlayerExists.moneyCount + Number(amount),
                    counterOfReceivedCoins: ensurePlayerExists.counterOfReceivedCoins + 1,
                    amountOfReceivedCoins: ensurePlayerExists.amountOfReceivedCoins + Number(amount)
                } );

                await ctx.reply(`✅ SENT ✅\n--------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>${ensurePlayerExists.heroName}</b> 👾
Amount: <b>${amount}💰</b>\nService fee: <b>${commission}</b>💰\nTo pay: <b>${amountWithCommission}</b>💰
\n/profile to see balance`, {parse_mode: 'HTML'} );
                console.log(`@${ctx.callbackQuery.from.username} (${senderId}) transferred ${amount} coins to @${receiverUserName} (${receiverId})`);
                break;
            }

            case 'cancel': {
                await ctx.answerCallbackQuery({
                    text: `‼ Transder cancelled ‼`,
                    show_alert: true
                } );
                
                break;
            }
        }

        await ctx.deleteMessage();
    }


}