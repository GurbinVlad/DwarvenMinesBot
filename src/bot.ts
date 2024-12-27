import type { CallbackQueryContext, CommandContext, Context } from 'grammy'
import type { Database } from './database/database.js'
import { randomInteger, randomSituationInMines } from './utilities.js'
import { Schedule } from './schedule.js'
import { Bot, InputFile } from 'grammy'

export class GemMinerBot {
	private bot: Bot
	private lastCommandTime: number = 0
	private lvlArr: number[] = [20, 50, 90, 150, 230, 340, 450, 560, 670, 780]
	private minPlayersForFund: number = 6

	constructor(
		token: string,
		private database: Database
	) {
		this.bot = new Bot(token)
		this.bot.use(async (ctx, next) => {
			if (!ctx.chat) {
				return
			}
			await this.database.getOrCreateChat(ctx.chat.id, this.dropCoinFunc.bind(this))
			return await next()
		})
		this.bot.command('start', this.handleStartCommand.bind(this))
		this.bot.command('help', this.handleHelpCommand.bind(this))
		this.bot.command('rules', this.handleRulesCommand.bind(this))
		this.bot.command('profile', this.handleProfileCommand.bind(this))
		this.bot.command('name', this.handleSetNameCommand.bind(this))
		this.bot.command('mine', this.handleMineCommand.bind(this))
		this.bot.command('top_help', this.handleTopHelpCommand.bind(this))
		this.bot.command('top_richest', this.handleRichestCommand.bind(this))
		this.bot.command('top_exp', this.handleExperiencedCommand.bind(this))
		this.bot.command('top_senders', this.handleTopSendCommand.bind(this))
		this.bot.command('top_receivers', this.handleTopReceiptCommand.bind(this))
		this.bot.command('tops', this.handleTopsCommand.bind(this))
		this.bot.command('tops_transfer', this.handleTopsTransferCommand.bind(this))
		this.bot.command('tops_donations', this.handleTopDonateFundCommand.bind(this))
		this.bot.command('sell', this.handleSellCommand.bind(this))
		this.bot.command('send', this.handleSendCommand.bind(this))
		this.bot.command('donate', this.handleDonateFundCommand.bind(this))
		this.bot.command('fund', this.handleShowFundBalanceCommand.bind(this))

		this.bot.callbackQuery('pick_coin', this.handlePickCoinClick.bind(this))
		this.bot.callbackQuery(
			/(confirm|cancel)~\d+~\d+~\d+~\d+~\d+/,
			this.handlePaymentConfirmClick.bind(this)
		)
		this.bot.callbackQuery(
			/(confirmDonate|cancelDonate)~\d+~(-)?\d+~\d+/,
			this.handleDonateFundConfirmClick.bind(this)
		)

		this.bot.catch(console.error)
		console.log('Bot created!')
	}

	public async start(): Promise<void> {
		const date: Date = new Date()
		console.log(`Bot started [ ${date} ]!`)
		this.bot.start()
		Schedule.scheduleCoinDropForAllChats(this.database, this.dropCoinFunc.bind(this))
	}

	private async dropCoinFunc(chatId: number) {
		const message = this.bot.api.sendMessage(
			chatId,
			'You see coins on the ground, a treasure waiting to be found 🪙',
			{
				reply_markup: {
					inline_keyboard: [
						[
							{
								text: 'Pick up',
								callback_data: 'pick_coin'
							}
						]
					]
				}
			}
		)

		const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))

		await Schedule.scheduleCoinDropForChat(
			this.database,
			this.dropCoinFunc.bind(this),
			tomorrow,
			chatId
		)
		return message
	}

	private checkMinPlayersForFund = async (chatId: number): Promise<boolean> => {
		const getPlayers = await this.database.findAllPlayers(chatId)
		const result = getPlayers.length >= this.minPlayersForFund ? true : false
		return result
	}

	private handleStartCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)

		const username = `@${ctx.message.from.username}`
		const message = `${username}, welcome to Dwarven Mines! 👋

⛏ Here is your pickaxe, use it to gain not only riches, but also fame!

See /help for all available commands in the game 👀 

✨ Good luck in the game! ✨`

		// Send a photo and text
		await ctx.replyWithPhoto(new InputFile('src/Pictures/welcomeToGame.png'), {
			caption: message
		})
		console.log(`${username}: joined the game.`)
	}

	private handleMineCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const setMineRegex = /^\/mine\s+([\p{L}]+(?:\s+[\p{L}]+)*)$/iu
		const messageText = ctx.message.text?.trim() || ''
		const match = messageText.match(setMineRegex)
		let location = null

		if (match) {
			location = match[1]
			if (location.length < 3 || location.length > 25) {
				await ctx.reply(
					`🗺You have asked cartographer about <b>«${location.slice(0, 25)}...»</b> but it took so long that he fell asleep 💤💤💤\n\n` +
						`🔄Try something else! (min. 3, max. 25 letters) ⌨️🔤`,
					{
						parse_mode: 'HTML'
					}
				)
				return
			}
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const username = `@${ctx.message.from.username}`
		const cooldownInSeconds = user.cooldown * 3600

		if (Date.now() - Number(user.lastMined) < user.cooldown * 3600 * 1000) {
			const remainingSeconds = Math.floor(
				cooldownInSeconds - (Date.now() - Number(user.lastMined)) / 1000
			)

			if (remainingSeconds > 0) {
				const remainingHours = Math.floor(remainingSeconds / 3600)
				const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60)
				const remainingSecs = remainingSeconds % 60

				await ctx.reply(
					`You can't mine now. Go take a rest for: <b><i>${remainingHours}h ${remainingMinutes}m ${remainingSecs}s</i></b> ⏱`,
					{
						parse_mode: 'HTML'
					}
				)
			} else {
				await ctx.reply("❌ You can't mine now. Try again later ❌")
			}

			return
		}

		if (user.gemsCount == user.baglimit) {
			await ctx.reply(
				'‼ You are not allowed to enter the mine. There is not enough space to store the gems. Sell the gems first ‼'
			)
			console.log(
				`${username}: reached the gems storage limit and was removed from the mine.`
			)
			return
		}

		let gems: number
		let exp: number

		if (user.playerLevel >= 10) {
			gems = randomInteger(-5, 15)
			exp = randomInteger(20, 25)
		} else if (user.playerLevel >= 5) {
			gems = randomInteger(-7, 12)
			exp = randomInteger(10, 20)
		} else {
			gems = randomInteger(-9, 10)
			exp = randomInteger(5, 10)
		}

		const gemsWord: string = gems === 1 || gems === -1 ? 'gem' : 'gems'
		const isFoundWord: string = gems > 0 ? 'received' : 'lost'

		if (user.gemsCount + gems < 0) {
			await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
				gemsCount: 0,
				expCount: user.expCount + exp,
				lastMined: new Date()
			})

			const { message, photoPath } = await randomSituationInMines(
				user.heroName,
				-user.gemsCount,
				exp,
				location
			)
			console.log(
				`${username}: ${isFoundWord} ${-user.gemsCount} ${gemsWord}, and received +${exp} EXP.`
			)
			await ctx.replyWithPhoto(new InputFile(photoPath), {
				caption: message,
				parse_mode: 'HTML'
			})
		} else if (user.gemsCount + gems > user.baglimit) {
			await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
				gemsCount: user.baglimit,
				expCount: user.expCount + exp,
				lastMined: new Date()
			})

			const { message, photoPath } = await randomSituationInMines(
				user.heroName,
				user.baglimit - user.gemsCount,
				exp,
				location
			)
			console.log(`${username}: ${isFoundWord} ${gems} ${gemsWord}, and +${exp} EXP.`)

			await ctx.replyWithPhoto(new InputFile(photoPath), {
				caption: message,
				parse_mode: 'HTML'
			})
		} else {
			await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
				gemsCount: user.gemsCount + gems,
				expCount: user.expCount + exp,
				lastMined: new Date()
			})

			const { message, photoPath } = await randomSituationInMines(
				user.heroName,
				gems,
				exp,
				location
			)
			console.log(`${username}: ${isFoundWord} ${gems} ${gemsWord}, and +${exp} EXP.`)

			await ctx.replyWithPhoto(new InputFile(photoPath), {
				caption: message,
				parse_mode: 'HTML'
			})
		}

		await this.database.ifUpdateLevel(
			ctx,
			ctx.message.from.id,
			ctx.message.chat.id,
			this.lvlArr
		)
	}

	private handleProfileCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)

		if (user.gemsCount === user.baglimit) {
			await ctx.reply(
				`👾 <b>${user.heroName}</b>\n
🏅 Level: ${user.playerLevel}     ⭐️ ${user.expCount} / ${user.newExp} \n\n💎 ${user.gemsCount} / ${user.baglimit}   💰 ${user.moneyCount}\n
‼ Your bag is full. Sell gems ‼`,
				{
					parse_mode: 'HTML'
				}
			)
		} else {
			await ctx.reply(
				`👾 <b>${user.heroName}</b>\n
🏅Level: ${user.playerLevel}    ⭐️ ${user.expCount} / ${user.newExp} \n\n💎 ${user.gemsCount} / ${user.baglimit}   💰 ${user.moneyCount}`,
				{
					parse_mode: 'HTML'
				}
			)
		}
	}

	private handleSetNameCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)

		const username = `@${ctx.message.from.username}`
		const setNameRegex = /^\/name(@DwarvenMinesBot)?\s+(.+)$/
		const setNameMatch = setNameRegex.exec(ctx.message.text || '')

		if (setNameMatch && setNameMatch[2]) {
			let name = setNameMatch[2].trim()
			name = name.slice(0, 30)
			const setName = name.replaceAll('<', '&lt;').replaceAll('>', '&gt;')

			const existingUser = await this.database.checkUniqueName(ctx.message.chat.id, setName)

			if (existingUser) {
				await ctx.reply(
					`❌ Sorry, the name '${setName}' is already taken. Think of something else!`,
					{
						parse_mode: 'HTML'
					}
				)

				console.log(
					`${username} tried to set the name '${setName}', but it was already taken.`
				)
				return
			}

			await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
				heroName: setName
			})

			await ctx.reply(`Cool! Now your dwarf's name is <b>${setName}</b> 👾`, {
				parse_mode: 'HTML'
			})

			console.log(`${username} named his dwarven --> ${setName}`)
		} else {
			await ctx.reply('❌ Name is not specified!\n\nFormat: /name <code>NAME</code>', {
				parse_mode: 'HTML'
			})

			console.log(`${username}: failed to change the name of his dwarven!`)
		}
	}

	private handleHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		/*if(ctx.message === undefined || ctx.message.date < (Date.now() / 1000) - 5) {
            return;
        }*/

		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const message =
			'📜Commands list📜\n' +
			'\n▫/rules — Rules of the game' +
			'\n▫/name <code>NAME</code> — Change dwarf name. Limit - 30 characters' +
			'\n▫/mine <code>[location]</code> — Go to mine. Additionally, can provide a specific location that comes to mind ' +
			'(only letters are available for the location, limit - from 3 to 25 letters)' +
			'\n▫/profile — Dwarf profile' +
			'\n▫/top_help — list of accessible commands for rating with a brief description' +
			'\n▫/sell <code>AMOUNT</code> — Exchange gems 💎 for coins 🪙 (/sell for info)' +
			'\n▫/send <code>AMOUNT</code> — Transfer 🪙 to other players (/send for info)' +
			'\n▫/donate <code>AMOUNT</code> — Donate 🪙 to a charitable foundation for dwarves in need 🛖 (/donate for info)' +
			'\n▫/fund — Charitable foundation for dwarves in need (the Charity fund is only available from 6 players in a group)'

		await ctx.replyWithPhoto(new InputFile('src/Pictures/commandsList.png'), {
			caption: message,
			parse_mode: 'HTML'
		})
	}

	private handleTopHelpCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const message =
			'📜 List commands for rating 📜\n' +
			'\n▫/tops — Overall rating with money and experience prizes' +
			'\n▫/tops_transfer — Overall rating with prizes for the best senders and recipients' +
			'\n▫/top_richest — Rating of the richest players' +
			'\n▫/top_exp — Rating of the most experienced players' +
			'\n▫/top_senders — Sender rating' +
			'\n▫/top_receivers — Recipient rating' +
			'\n▫/tops_donations — Rating of charitable assistance from players'

		await ctx.replyWithPhoto(new InputFile('src/Pictures/commandsList.png'), {
			caption: message,
			parse_mode: 'HTML'
		})
	}

	private handleRulesCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const message =
			'<b>🔰Rules Of The Game🔰</b> \n' +
			'\n' +
			'<i>👋 Hey! Are you our new mine explorer?</i> \n' +
			'<i>Perfect! Let me explain you some details:</i> \n' +
			'\n' +
			'1️⃣ Our mines are full of different gems 💎, so you can try to find them all! 😁 \n' +
			'2️⃣ <b>Mining - is a dangerous activity</b> ☠️. You must to be careful, if you don`t want to lost all your gems 🙃 \n' +
			'3️⃣ Do not forget to sell your new gems!☝️ I know, that you`re very strong dwarf, but your backpack isn`t as good as you... 😅 \n' +
			'4️⃣ Mines are very tiring, i know. At first, you will mine only once a day, but who knows, how enduring will you be? 🤔 \n' +
			'5️⃣ Competition and achievement are the basis! Check the ratings and compete with other players to become the best miner, sender, receiver, or even the most generous donor! 🏆' +
			'\n\n' +
			'<i>✔I think that’s the most important stuff. Good luck! Oh, and please, try not to die... 🙂</i>'

		await ctx.replyWithPhoto(new InputFile('src/Pictures/rules.png'), {
			caption: message,
			parse_mode: 'HTML'
		})
	}

	private handleRichestCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)

		const ratingForRichest = await this.database.sortAllRichestPlayers(ctx.message.chat.id)
		const ratingStringsForRichest = ratingForRichest.map((player, index) => {
			const emoji = index === 0 ? '👑' : ''
			return `${index + 1}.${emoji} ${player.heroName}  -  💎 <b>${
				player.gemsCount
			}</b>  🪙 <b>${player.moneyCount}</b>`
		})

		const ratingMessageForRichest =
			ratingStringsForRichest.length > 0
				? ratingStringsForRichest.join('\n')
				: '<i>‼ Players not found ‼</i>'

		await ctx.reply(`⛏<b>Richest players</b>⛏\n\n${ratingMessageForRichest}`, {
			parse_mode: 'HTML'
		})
	}

	private handleExperiencedCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)

		const ratingForExperienced = await this.database.sortAllExperiencedPlayers(
			ctx.message.chat.id
		)

		const ratingStringsForExperienced = ratingForExperienced.map((player, index) => {
			const emoji = index === 0 ? '👑' : ''
			return `${index + 1}.${emoji} ${player.heroName}  -  🏅 <b>${
				player.playerLevel
			}</b>  ⭐️ <b>${player.expCount} / ${player.newExp}</b>`
		})

		const ratingMessageForExperienced =
			ratingStringsForExperienced.length > 0
				? ratingStringsForExperienced.join('\n')
				: '<i>‼ No players found ‼</i>'

		await ctx.reply(`⛏<b>Most experienced players</b>⛏\n\n${ratingMessageForExperienced}`, {
			parse_mode: 'HTML'
		})
	}

	private handleTopsCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const limitUsers: number = 3

		/// For riches

		let ratingForRichest = await this.database.sortAllRichestPlayers(ctx.message.chat.id)

		const currentUserIndexRichest = ratingForRichest.findIndex(
			player => player.userId === ctx.message.from.id
		)
		const findCurrentUserData = ratingForRichest.find(
			player => player.userId === ctx.message.from.id
		)

		ratingForRichest = ratingForRichest.slice(0, limitUsers)

		const ratingStringsForRichest = ratingForRichest.map((player, index) => {
			let emoji = ''
			if (index === 0) {
				emoji = '🥇'
			} else if (index === 1) {
				emoji = '🥈'
			} else if (index === 2) {
				emoji = '🥉'
			}

			return `${emoji} ${player.heroName}  -  💎 <b>${player.gemsCount}</b> 🪙 <b>${player.moneyCount}</b>`
		})

		const ratingMessageForRichest =
			ratingStringsForRichest.length > 0
				? ratingStringsForRichest.join('\n')
				: '<i>‼ No players found ‼</i>'

		const youLine = `You  -  💎 ${findCurrentUserData?.gemsCount} 🪙 ${findCurrentUserData?.moneyCount}`
		const currentUserPlaceRichest =
			currentUserIndexRichest !== -1
				? `№.${currentUserIndexRichest + 1} ${youLine}`
				: '👤You - Unrated ⛔'

		/// For experienced

		let ratingForExperienced = await this.database.sortAllExperiencedPlayers(
			ctx.message.chat.id
		)
		const currentUserIndexExperienced = ratingForExperienced.findIndex(
			player => player.userId === ctx.message.from.id
		)

		ratingForExperienced = ratingForExperienced.slice(0, limitUsers)

		const ratingStringsForExperienced = ratingForExperienced.map((player, index) => {
			let emoji = ''
			if (index === 0) {
				emoji = '🥇'
			} else if (index === 1) {
				emoji = '🥈'
			} else if (index === 2) {
				emoji = '🥉'
			}

			return `${emoji} ${player.heroName}  -  🏅 <b>${player.playerLevel}</b>  ⭐️ <b>${player.expCount} / ${player.newExp}</b>`
		})

		const ratingMessageForExperienced =
			ratingStringsForExperienced.length > 0
				? ratingStringsForExperienced.join('\n')
				: '<i>‼ No players found ‼</i>'

		const youLineExp = `You  -  🏅 ${findCurrentUserData?.playerLevel}  ⭐️ ${findCurrentUserData?.expCount} / ${findCurrentUserData?.newExp}`

		const currentUserPlaceExperienced =
			currentUserIndexExperienced !== -1
				? `№.${currentUserIndexExperienced + 1} ${youLineExp}`
				: '👤You - Unrated ⛔'

		/// Out

		await ctx.reply(
			`⛏<b>Richest players</b>⛏\n\n${ratingMessageForRichest} \n\n <b>${currentUserPlaceRichest}</b>
\n\n\n⛏<b>Most experienced players</b>⛏\n\n${ratingMessageForExperienced}\n\n <b>${currentUserPlaceExperienced}</b>`,
			{
				parse_mode: 'HTML'
			}
		)
	}

	private handleTopSendCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const ratingForGenerous = await this.database.sortAllSenders(ctx.message.chat.id)

		const ratingStringsForGenerous = ratingForGenerous.map((player, index) => {
			const emoji = index === 0 ? '🤑' : ''
			return `${index + 1}.${emoji} ${player.heroName}  -  <b>${
				player.amountOfSentCoins
			}</b>🪙 <b>(${player.counterOfSentCoins})</b>`
		})

		const ratingMessageForGenerous =
			ratingStringsForGenerous.length > 0
				? ratingStringsForGenerous.join('\n')
				: '<i>‼ No players found ‼</i>'

		await ctx.reply(`⛏<b>Top senders</b>⛏\n\n${ratingMessageForGenerous}`, {
			parse_mode: 'HTML'
		})
	}

	private handleTopReceiptCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const ratingForHappiest = await this.database.sortAllReceivers(ctx.message.chat.id)

		const ratingStringsForHappiest = ratingForHappiest.map((player, index) => {
			const emoji = index === 0 ? '💸' : ''
			return `${index + 1}.${emoji} ${player.heroName}  -  <b>${
				player.amountOfReceivedCoins
			}</b>🪙 <b>(${player.counterOfReceivedCoins})</b>`
		})

		const ratingMessageForHappiest =
			ratingStringsForHappiest.length > 0
				? ratingStringsForHappiest.join('\n')
				: '<i>‼ No players found ‼</i>'

		await ctx.reply(`⛏<b>Top recipients</b>⛏\n\n${ratingMessageForHappiest}`, {
			parse_mode: 'HTML'
		})
	}

	private handleTopsTransferCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const limitUsers: number = 3

		/// For senders

		let ratingForSenders = await this.database.sortAllSenders(ctx.message.chat.id)

		const findCurrentUserData = ratingForSenders.find(
			player => player.userId === ctx.message.from.id
		)
		const currentUserIndexSenders = ratingForSenders.findIndex(
			player => player.userId === ctx.message.from.id
		)

		ratingForSenders = ratingForSenders.slice(0, limitUsers)

		const ratingStringsForSenders = ratingForSenders.map((player, index) => {
			let emoji = ''
			if (index === 0) {
				emoji = '🥇'
			} else if (index === 1) {
				emoji = '🥈'
			} else if (index === 2) {
				emoji = '🥉'
			}

			return `${emoji} ${player.heroName}  -  <b>${player.amountOfSentCoins}</b>🪙  <b>(${player.counterOfSentCoins})</b>`
		})

		const ratingMessageForSenders =
			ratingStringsForSenders.length > 0
				? ratingStringsForSenders.join('\n')
				: '<i>‼ No players found ‼</i>'

		const youLineSenders = `You  -  ${findCurrentUserData?.amountOfSentCoins}🪙  ${findCurrentUserData?.counterOfSentCoins}`

		const currentUserPlaceSenders =
			currentUserIndexSenders !== -1
				? `${currentUserIndexSenders + 1}. ${youLineSenders}`
				: '👤You - Unrated ⛔'

		/// For receivers

		let ratingForReceivers = await this.database.sortAllReceivers(ctx.message.chat.id)

		const currentUserIndexReceivers = ratingForReceivers.findIndex(
			player => player.userId === ctx.message.from.id
		)

		ratingForReceivers = ratingForReceivers.slice(0, limitUsers)

		const ratingStringsForReceivers = ratingForReceivers.map((player, index) => {
			let emoji = ''
			if (index === 0) {
				emoji = '🥇'
			} else if (index === 1) {
				emoji = '🥈'
			} else if (index === 2) {
				emoji = '🥉'
			}

			return `${emoji} ${player.heroName}  -  <b>${player.amountOfReceivedCoins}</b>🪙  <b>(${player.counterOfReceivedCoins})</b>`
		})

		const ratingMessageForReceivers =
			ratingStringsForReceivers.length > 0
				? ratingStringsForReceivers.join('\n')
				: '<i>‼ No players found ‼</i>'

		const youLineReceivers = `You  -  ${findCurrentUserData?.amountOfReceivedCoins}🪙  ${findCurrentUserData?.counterOfReceivedCoins}`

		const currentUserPlaceReceivers =
			currentUserIndexReceivers !== -1
				? `${currentUserIndexReceivers + 1}. ${youLineReceivers}`
				: '👤You - Unrated ⛔'

		/// Out

		await ctx.reply(
			`⛏<b>Top senders</b>⛏\n\n${ratingMessageForSenders} \n\n <b>${currentUserPlaceSenders}</b>
\n\n\n⛏<b>Top recipients</b>⛏\n\n${ratingMessageForReceivers}\n\n <b>${currentUserPlaceReceivers}</b>`,
			{
				parse_mode: 'HTML'
			}
		)
	}

	private handleTopDonateFundCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const ratingForDonate = await this.database.sortAllTheDonatedPlayers(ctx.message.chat.id)

		const ratingStringsForDonate = ratingForDonate.map((player, index) => {
			const emoji = index === 0 ? '👼' : ''
			return `${index + 1}.${emoji} ${player.heroName}  -  <b>${
				player.amountOfDonatedCoins
			}</b>🪙 <b>(${player.counterOfDonatedCoins})</b>`
		})

		const ratingMessageForDonate =
			ratingStringsForDonate.length > 0
				? ratingStringsForDonate.join('\n')
				: '<i>‼ No players found ‼</i>'

		await ctx.reply(`⛏<b>Top donations</b>⛏\n\n${ratingMessageForDonate}`, {
			parse_mode: 'HTML'
		})
	}

	private handleSellCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const sellRegex = /^\/sell\s+(-?\d+?)?$/
		const sellMatch = sellRegex.exec(ctx.message.text || '')

		if (sellMatch && sellMatch[1]) {
			const amount = Number(sellMatch[1])

			if (amount > user.gemsCount) {
				await ctx.reply('❌ You have less gems to exchange than you should!')
				console.log(
					`@${ctx.message.from.username}: tried to exchange more gems than he has`
				)
				return
			} else if (amount <= 0 || isNaN(amount)) {
				await ctx.reply(
					'❌ You have entered an invalid value for selling gems! \n\n👉🏽 Enter another value!'
				)
				console.log(
					`@${ctx.message.from.username}: entered an invalid value for selling gems.`
				)
				return
			} else if (sellMatch[1] === undefined) {
				return
			} else {
				const coins = amount * 5
				await ctx.reply(`You sold <b>${amount}</b>💎 and received <b>${coins}</b>🪙`, {
					parse_mode: 'HTML'
				})
				console.log(`@${ctx.message.from.username}: sold ${amount} gems -> ${coins} coins`)

				await this.database.updateUser(ctx.message.from.id, ctx.message.chat.id, {
					gemsCount: user.gemsCount - amount,
					moneyCount: user.moneyCount + coins
				})
			}
		} else {
			await ctx.reply(
				`You can exchange your 💎 for 🪙 (1 : 5)\nYour bag: <b>${user.gemsCount}</b>💎\n\n‼ Use: /sell <code>AMOUNT</code> to sell ‼`,
				{
					parse_mode: 'HTML'
				}
			)
			console.log(
				`@${ctx.message.from.username}: entered the /sell command without additional parameters`
			)
			return
		}
	}

	private handleSendCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const user = await this.database.getOrCreateUser(ctx.message.from.id, ctx.message.chat.id)
		const sendRegex = /^\/send\s+(-?\d+?)?$/
		const sendMatch = sendRegex.exec(ctx.message.text || '')
		const recipient = ctx.message.reply_to_message?.from?.id
		const chatId = ctx.message.chat.id

		let transferTimer: number
		let transferTimerText: string

		if (user.playerLevel > 10) {
			transferTimer = 0.5
			transferTimerText = '<b>1</b> transfer within <b>30</b> minutes ⏱'
		} else {
			transferTimer = 1
			transferTimerText = 'no more than <b>1</b> transfer per hour ⏱'
		}

		const cooldownInSeconds = transferTimer * 3600
		const message =
			`You can send money 🪙 to other players using 🛖 <b>Dwarven Bank.</b> 
The commission removed from the transfer of 🪙 will be donated to a charitable foundation for needy dwarves 🛖
Use "/send <code>AMOUNT</code>" command in reply to a message to make a transfer.\n\n` +
			'⚠ Service fees:\n' +
			'▫Less than 100🪙 ⇒ <b>1🪙 + 2%</b>\n' +
			'▫100🪙 to 200🪙 ⇒ <b>1%</b>\n' +
			'▫200🪙 and more ⇒ <b>0.5%</b>' +
			'\n\n⚠ Minimal transfer is <b>5🪙</b>' +
			`\n⚠ Transfer limit - ${transferTimerText}`

		if (!recipient) {
			await ctx.replyWithPhoto(new InputFile('src/Pictures/fund.png'), {
				caption: message,
				parse_mode: 'HTML'
			})
			return
		}

		if (sendMatch && sendMatch[1]) {
			const amount = Number(sendMatch[1])
			let amountWithCommission = amount
			let commission: number
			/// let word = amount === 1 || amount === -1 ? 'coin' : 'coins';

			const ensurePlayerExists = await this.database.ensurePlayerExists(recipient, chatId)

			if (amount < 100) {
				commission = Math.floor(1 + (amount * 2) / 100)
				amountWithCommission += Math.floor(1 + (amount * 2) / 100)
			} else if (amount >= 100 && amount < 200) {
				commission = Math.floor(amount / 100)
				amountWithCommission += Math.floor(amount / 100)
			} else {
				commission = Math.floor((amount * 0.5) / 100)
				amountWithCommission += Math.floor((amount * 0.5) / 100)
			}

			if (recipient == ctx.message.from.id) {
				await ctx.reply(
					`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${user.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Transferring itself is impossible</u></b>`,
					{
						parse_mode: 'HTML'
					}
				)
				return
			}

			if (ensurePlayerExists === null) {
				await ctx.reply(
					`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>unknown</b>\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Receiver not found</u></b>`,
					{
						parse_mode: 'HTML'
					}
				)
				console.log(
					`@${ctx.message.from.username}: made a transfer of coins to a non-existent player`
				)
				return
			} else {
				if (amountWithCommission > user.moneyCount) {
					await ctx.reply(
						`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Not enough money</u></b>`,
						{
							parse_mode: 'HTML'
						}
					)
					console.log(
						`@${ctx.message.from.username}: wanted to send more coins than he has`
					)
					return
				} else if (amount > 0 && amount < 5) {
					await ctx.reply(
						`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Minimal transfer amount is 5🪙</u></b>`,
						{
							parse_mode: 'HTML'
						}
					)
					return
				} else if (amount <= 0 || isNaN(amount)) {
					await ctx.reply(
						`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Invalid amount</u></b>`,
						{
							parse_mode: 'HTML'
						}
					)
					console.log(
						`@${ctx.message.from.username}: entered an invalid value for transferring coins!`
					)
					return
				}

				if (Date.now() - Number(user.lastSend) < transferTimer * 3600 * 1000) {
					const remainingSeconds = Math.floor(
						cooldownInSeconds - (Date.now() - Number(user.lastSend)) / 1000
					)

					if (remainingSeconds > 0) {
						const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60)
						const remainingSecs = remainingSeconds % 60

						await ctx.reply(
							`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${ensurePlayerExists.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Transfer limit exceeded</u></b>\nTry again in: <b><i>${remainingMinutes}m ${remainingSecs}s</i></b> ⏱`,
							{
								parse_mode: 'HTML'
							}
						)
					} else {
						await ctx.reply('⚠️ Transfer limit exceeded! ⚠️')
					}
					return
				}

				const senderId = ctx.from.id
				const receiverId = ctx.message.reply_to_message?.from?.id

				await ctx.reply(
					`⚜ PAYMENT ⚜\n--------------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>${ensurePlayerExists.heroName}</b> 👾
Amount: <b>${amount}🪙</b>\nService fee: <b>${commission}</b>🪙\nTo pay: <b>${amountWithCommission}</b>🪙\n\nConfirm transfer?`,
					{
						reply_markup: {
							inline_keyboard: [
								[
									{
										text: 'YES 🟢',
										callback_data: `confirm~${senderId}~${receiverId}~${amount}~${commission}~${amountWithCommission}`
									},
									{
										text: 'NO 🔴',
										callback_data: `cancel~${senderId}~${receiverId}~${amount}~${commission}~${amountWithCommission}`
									}
								]
							]
						},
						parse_mode: 'HTML'
					}
				)
			}
		} else {
			await ctx.replyWithPhoto(new InputFile('src/Pictures/fund.png'), {
				caption: message,
				parse_mode: 'HTML'
			})
			return
		}
	}

	private handlePaymentConfirmClick = async (ctx: CallbackQueryContext<Context>) => {
		if (!ctx.chat) {
			return
		}

		const chatId = ctx.chat.id
		const callbackQueryUser = ctx.callbackQuery.from.id
		const data = ctx.callbackQuery.data

		if (!data) {
			return
		}

		const [buttonId, senderId, receiverId, amount, commission, amountWithCommission] =
			data.split('~')

		const user = await this.database.getOrCreateUser(callbackQueryUser, chatId)
		const receiver = await this.database.ensurePlayerExists(Number(receiverId), chatId)
		const chat = await this.database.getOrCreateChat(chatId, this.dropCoinFunc.bind(this))

		if (receiver === null) {
			return
		}

		if (callbackQueryUser !== Number(senderId)) {
			await ctx.answerCallbackQuery({
				text: '❌ Access denied ❌'
			})
			return
		}

		switch (buttonId) {
			case 'confirm': {
				const transferTimer = user.playerLevel > 10 ? 0.5 : 1
				const cooldownInSeconds = transferTimer * 3600

				if (Date.now() - Number(user.lastSend) < transferTimer * 3600 * 1000) {
					const remainingSeconds = Math.floor(
						cooldownInSeconds - (Date.now() - Number(user.lastSend)) / 1000
					)

					if (remainingSeconds > 0) {
						const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60)
						const remainingSecs = remainingSeconds % 60

						await ctx.deleteMessage()

						await ctx.reply(
							`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${receiver.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Transfer limit exceeded</u></b>\nTry again in: <b><i>${remainingMinutes}m ${remainingSecs}s</i></b> ⏱`,
							{
								parse_mode: 'HTML'
							}
						)
					} else {
						await ctx.reply('⚠️ Transfer limit exceeded! ⚠️')
					}
					return
				}

				if (Number(amountWithCommission) > user.moneyCount) {
					await ctx.reply(
						`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>${receiver.heroName}</b> 👾\nAmount: <b>${amount}🪙</b>\nService fee: <b>${commission}🪙</b>
To pay: <b>${amountWithCommission}</b>🪙\n\n<b>Reason: <u>Not enough money</u></b>`,
						{
							parse_mode: 'HTML'
						}
					)
					console.log(
						`@${ctx.callbackQuery.from.username}: wanted to send more coins than he has.`
					)
					await ctx.deleteMessage()
					return
				}

				await ctx.answerCallbackQuery({
					text: '✅ SENT ✅',
					show_alert: true
				})

				await this.database.updateUser(callbackQueryUser, chatId, {
					moneyCount: user.moneyCount - Number(amountWithCommission),
					lastSend: new Date(),
					counterOfSentCoins: user.counterOfSentCoins + 1,
					amountOfSentCoins: user.amountOfSentCoins + Number(amount)
				})

				await this.database.updateUser(Number(receiverId), chatId, {
					moneyCount: receiver.moneyCount + Number(amount),
					counterOfReceivedCoins: receiver.counterOfReceivedCoins + 1,
					amountOfReceivedCoins: receiver.amountOfReceivedCoins + Number(amount)
				})

				await this.database.updateChat(chatId, {
					bankBalance: chat.bankBalance + Number(commission)
				})

				await ctx.reply(
					`✅ SENT ✅\n--------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>${receiver.heroName}</b> 👾
Amount: <b>${amount}🪙</b>\nService fee: <b>${commission}</b>🪙\nTo pay: <b>${amountWithCommission}</b>🪙
\nUse /profile to see balance`,
					{
						parse_mode: 'HTML'
					}
				)
				console.log(
					`@${ctx.callbackQuery.from.username}: ${user.heroName} (${senderId}) transferred ${amount} coins to ${receiver.heroName} (${receiverId})`
				)

				const checkMinPlayersForFund = await this.checkMinPlayersForFund(chatId)

				if (checkMinPlayersForFund) {
					await this.checkFundBalance(ctx, chatId)
				}
				break
			}

			case 'cancel': {
				await ctx.answerCallbackQuery({
					text: '‼ Transaction is cancelled ‼',
					show_alert: true
				})
				break
			}
		}
		await ctx.deleteMessage()
	}

	private handleDonateFundCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const chatId = ctx.message.chat.id
		const checkMinPlayersForFund = await this.checkMinPlayersForFund(chatId)

		if (checkMinPlayersForFund == false) {
			const message = '⚠️The Charity fund is only available from 6 players in a group⚠️'
			await ctx.replyWithPhoto(new InputFile('src/Pictures/fund.png'), {
				caption: message,
				parse_mode: 'HTML'
			})
			return
		}

		const user = await this.database.getOrCreateUser(ctx.message.from.id, chatId)
		const sendRegex = /^\/(donate|donate@DwarvenMinesBot)\s+(-?\d+?)?$/
		const sendMatch = sendRegex.exec(ctx.message.text || '')
		// let word = amount === 1 || amount === -1 ? 'coin' : 'coins';

		if (sendMatch && sendMatch[2]) {
			const amount = Number(sendMatch[2])

			if (amount > user.moneyCount) {
				await ctx.reply(
					`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>Dwarven Bank</b> 🛖\nDonate: <b>${amount}</b>🪙\n\n<b>Reason: <u>Not enough money</u></b>`,
					{
						parse_mode: 'HTML'
					}
				)
				console.log(
					`@${ctx.message.from.username}: wanted to donate more coins than he has`
				)
				return
			} else if (amount < 1 || isNaN(amount)) {
				await ctx.reply(
					`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>Dwarven Bank</b> 🛖\nDonate: <b>${amount}</b>🪙\n\n<b>Reason: <u>Invalid amount</u></b>`,
					{
						parse_mode: 'HTML'
					}
				)
				console.log(
					`@${ctx.message.from.username}: entered an invalid value for transferring coins!`
				)
				return
			}

			const senderId = ctx.from.id

			await ctx.reply(
				`⚜ DONATION ⚜\n---------------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>Dwarven Bank</b> 🛖
Donate: <b>${amount}</b>🪙\n\nConfirm donate?`,
				{
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'YES 🟢',
									callback_data: `confirmDonate~${senderId}~${chatId}~${amount}`
								},
								{
									text: 'NO 🔴',
									callback_data: `cancelDonate~${senderId}~${chatId}~${amount}`
								}
							]
						]
					},
					parse_mode: 'HTML'
				}
			)
		} else {
			const message = `You can donate money 🪙 to the charity /fund of the 🛖 <b>Dwarven Bank</b>
Use "/donate <code>AMOUNT</code>" command to make a donation`

			await ctx.replyWithPhoto(new InputFile('src/Pictures/fund.png'), {
				caption: message,
				parse_mode: 'HTML'
			})
			return
		}
	}

	private handleDonateFundConfirmClick = async (ctx: CallbackQueryContext<Context>) => {
		const callbackQueryUser = ctx.callbackQuery.from.id
		const data = ctx.callbackQuery.data

		if (!data) {
			return
		}

		const [buttonId, senderId, chatId, amount] = data.split('~')
		const user = await this.database.getOrCreateUser(callbackQueryUser, Number(chatId))
		const chat = await this.database.getOrCreateChat(
			Number(chatId),
			this.dropCoinFunc.bind(this)
		)

		if (callbackQueryUser !== Number(senderId)) {
			await ctx.answerCallbackQuery({
				text: '❌ Access denied ❌'
			})
			return
		}

		switch (buttonId) {
			case 'confirmDonate': {
				if (Number(amount) > user.moneyCount) {
					await ctx.reply(
						`⚠️ REJECTED ⚠️\n---------------------------\nSender: <b>${user.heroName}</b> 👾
Receiver: <b>Dwarven Bank</b> 🛖\nDonate: <b>${amount}</b>🪙\n\n<b>Reason: <u>Not enough money</u></b>`,
						{
							parse_mode: 'HTML'
						}
					)
					console.log(
						`@${ctx.callbackQuery.from.username}: wanted to donate more coins than he has`
					)
					await ctx.deleteMessage()
					return
				}

				await ctx.answerCallbackQuery({
					text: '✅ SENT ✅',
					show_alert: true
				})

				await this.database.updateUser(callbackQueryUser, Number(chatId), {
					moneyCount: user.moneyCount - Number(amount),
					counterOfDonatedCoins: user.counterOfDonatedCoins + 1,
					amountOfDonatedCoins: user.amountOfDonatedCoins + Number(amount)
				})

				await this.database.updateChat(Number(chatId), {
					fundBalance: chat.fundBalance + Number(amount)
				})

				await ctx.reply(
					`✅ SENT ✅\n--------------------\nSender: <b>${user.heroName}</b> 👾\nReceiver: <b>Dwarven Bank</b> 🛖
Donate: <b>${amount}</b>🪙\n\nUse /profile to see balance`,
					{
						parse_mode: 'HTML'
					}
				)
				console.log(
					`@${ctx.callbackQuery.from.username}: (${senderId}) transferred ${amount} coins to "🛖 Сharitable foundation for dwarves in need"`
				)
				await this.checkFundBalance(ctx, Number(chatId))
				break
			}

			case 'cancelDonate': {
				await ctx.answerCallbackQuery({
					text: '‼ Donation cancelled ‼',
					show_alert: true
				})
				break
			}
		}
		await ctx.deleteMessage()
	}

	private checkFundBalance = async (
		ctx: CallbackQueryContext<Context> | CommandContext<Context>,
		chatId: number
	): Promise<void> => {
		const chat = await this.database.getOrCreateChat(chatId, this.dropCoinFunc.bind(this))
		const getAllRichestPlayers = await this.database.sortAllRichestPlayers(chatId)
		const amountHappiestPlayers: number = 3
		const fromBank = Math.floor((80 * chat.bankBalance) / 100)
		const totalFund = chat.fundBalance + fromBank

		if (totalFund < chat.fundGoal) {
			return
		}

		const perUser = Math.floor(totalFund / amountHappiestPlayers)
		const strPlayer = []
		let selectedPlayer
		let playerIndex = getAllRichestPlayers.length - amountHappiestPlayers

		for (let i = 0; i < amountHappiestPlayers; i++) {
			selectedPlayer = getAllRichestPlayers[playerIndex]

			await this.database.updateUser(selectedPlayer.userId, chatId, {
				moneyCount: selectedPlayer.moneyCount + perUser
			})
			strPlayer.push(`${selectedPlayer.heroName}`)
			playerIndex++
		}

		await this.database.updateChat(chatId, {
			bankBalance: chat.bankBalance - fromBank,
			fundBalance: 0,
			fundGoal: randomInteger(150, 350)
		})

		await ctx.reply(
			`🛖 Foundation of the <b>Dwarven Bank</b> has been withdrawn!\n
Dwarfs got <b>${perUser}🪙</b> each, for a total withdrawal of <b>${totalFund}🪙</b>:
<b>1. ${strPlayer[0]} 👾
2. ${strPlayer[1]} 👾
3. ${strPlayer[2]} 👾</b>`,
			{
				parse_mode: 'HTML'
			}
		)

		const updatedChat = await this.database.getOrCreateChat(
			chatId,
			this.dropCoinFunc.bind(this)
		) /// data update for checking with database to avoid recursion
		const fromBankRepeat = Math.floor((80 * updatedChat.bankBalance) / 100)
		const totalFundRepeat = updatedChat.fundBalance + fromBankRepeat

		if (totalFundRepeat >= updatedChat.fundGoal) {
			await ctx.reply(
				`🔁80% of the bank's balance, after the distribution of donations, still exceeds the set goal of the Charity fund! (it is -> ${updatedChat.fundGoal}🪙)
🔁Soon, we will be distributing donations to the needy dwarves again!`
			)
			await this.checkFundBalance(ctx, chatId)
			console.log(
				`Warning about the Charitable Foundation: The bank balance has been exceeded by the fund goal by two times!
The next goal after the donations were distributed was: ${updatedChat.fundGoal} -> The checkFundBalance() function was called again`
			)
		} else {
			console.log(
				`Coins from the fund were distributed: \n1. ${strPlayer[0]}; \n2. ${strPlayer[1]}; \n3. ${strPlayer[2]}.`
			)
		}
	}

	private handlePickCoinClick = async (ctx: CallbackQueryContext<Context>) => {
		const callbackQueryUser = ctx.callbackQuery.from.id
		const chatId = ctx.chat?.id

		if (!chatId) {
			return
		}

		const user = await this.database.getOrCreateUser(callbackQueryUser, chatId)
		const pickedCoins = randomInteger(1, 10)
		const word = pickedCoins === 1 || pickedCoins === -1 ? 'coin' : 'coins'

		await this.database.updateUser(user.userId, user.chatId, {
			moneyCount: user.moneyCount + pickedCoins
		})

		await ctx.editMessageText(
			`You see ${word} on the ground, a treasure waiting to be found 🪙\n\n<i>${user.heroName} picked up ${pickedCoins} 🪙</i>`,
			{
				parse_mode: 'HTML'
			}
		)

		await ctx.answerCallbackQuery({
			text: `You pick up the ${word}, feeling their weight in your hand. A treasure found, a fortune grand. You got ${pickedCoins} 🪙`,
			show_alert: true
		})
	}

	private handleShowFundBalanceCommand = async (ctx: CommandContext<Context>): Promise<void> => {
		if (ctx.message === undefined) {
			return
		}

		const currentTime = Date.now() / 1000
		if (currentTime - this.lastCommandTime < 1) {
			return
		}
		this.lastCommandTime = currentTime

		const chatId = ctx.message.chat.id
		await this.checkFundBalance(ctx, Number(chatId))
		await this.database.getOrCreateUser(ctx.message.from.id, chatId)
		const chat = await this.database.getOrCreateChat(chatId, this.dropCoinFunc.bind(this))
		const fromBank = Math.floor(chat.bankBalance * (80 / 100))
		const total = fromBank + chat.fundBalance

		const message = `<b>Charity fund of the 🛖 Dwarven Bank</b>\n
▹ Goal: <b>${chat.fundGoal}🪙</b>\n▹ Balance: <b>${total}🪙</b>
▹ Left for withdrawal: <b>${chat.fundGoal - total}🪙</b>\n\n ➡-➡-↘
▫After the fund reaches its maximum, all the funds raised will be distributed to 3 needy dwarves in the group.
▫80% of the balance of service costs automatically goes to the fund balance.
▫Use <code>/donate AMOUNT</code> to make a donation. \n➡-➡-↗`

		await ctx.replyWithPhoto(new InputFile('src/Pictures/fund.png'), {
			caption: message,
			parse_mode: 'HTML'
		})
	}
}
