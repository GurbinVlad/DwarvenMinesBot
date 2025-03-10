import type { CommandContext, Context } from 'grammy'
import type { Player, Chat } from './types.js'
import type { Collection } from 'mongodb'
import { MongoClient } from 'mongodb'
import { randomName } from '../utilities.js'
import { Schedule } from '../schedule.js'

export class Database {
	private client: MongoClient
	private players: Collection<Player>
	private chats: Collection<Chat>

	constructor() {
		if (!process.env.DB_URL || !process.env.DB_NAME) {
			console.error('DB_URL or DB_NAME not found')
			process.exit(1)
		}

		this.client = new MongoClient(process.env.DB_URL)
		const mongoDb = this.client.db(process.env.DB_NAME)
		this.players = mongoDb.collection('Players')
		this.chats = mongoDb.collection('Chats')
	}

	async connect() {
		try {
			await this.client.connect()
			console.log('Database connection successful!')
		} catch (error) {
			console.error('Database connection failed:', error)
			process.exit(1)
		}
	}

	async getOrCreateUser(userId: Player['userId'], chatId: Player['chatId']): Promise<Player> {
		const result = await this.players.findOne({ userId, chatId })

		if (result === null) {
			await this.players.insertOne({
				userId,
				chatId,
				cooldown: 24,
				baglimit: 10,
				heroName: randomName(),
				playerLevel: 1,
				expCount: 0,
				newExp: 20,
				expBarIndex: 0,
				gemsCount: 0,
				moneyCount: 0,
				lastMined: new Date(0),
				lastSend: new Date(0),
				counterOfSentCoins: 0,
				amountOfSentCoins: 0,
				counterOfReceivedCoins: 0,
				amountOfReceivedCoins: 0,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			})

			return await this.getOrCreateUser(userId, chatId)
		}

		return result
	}

	async getOrCreateChat(
		chatId: Chat['chatId'],
		dropCoinFunc: (chatId: number) => void
	): Promise<Chat> {
		const result = await this.chats.findOne({ chatId })

		if (result === null) {
			await this.chats.insertOne({
				chatId,
				bankBalance: 0,
				fundBalance: 0,
				fundGoal: 100,
				coinScheduledAt: new Date(2004)
			})

			const chat = await this.getOrCreateChat(chatId, dropCoinFunc)

			await Schedule.scheduleCoinDropForChat(this, dropCoinFunc, new Date(), chatId)

			return chat
		}

		return result
	}

	async getChats(): Promise<Chat[]> {
		return this.chats.find().toArray()
	}

	async updateUser(
		userId: Player['userId'],
		chatId: Player['chatId'],
		allFields: Partial<Player>
	): Promise<void> {
		await this.players.updateOne({ userId, chatId }, { $set: allFields })
	}

	async updateChat(chatId: Chat['chatId'], allFields: Partial<Chat>): Promise<void> {
		await this.chats.updateOne({ chatId }, { $set: allFields })
	}

	async checkUniqueName(chatId: Player['chatId'], setName: string) {
		const players = await this.players.find({ chatId }).toArray()
		return players.some(player => player.heroName === setName)
	}

	async findAllPlayers(chatId: Player['chatId']) {
		return this.players.find({ chatId }).toArray()
	}

	async sortAllRichestPlayers(chatId: Player['chatId']) {
		const result = await this.players.find({ chatId }).toArray()
		return result.sort(
			(a, b) => b.gemsCount * 5 + b.moneyCount - (a.gemsCount * 5 + a.moneyCount)
		)
	}

	async sortAllExperiencedPlayers(chatId: Player['chatId']) {
		const result = await this.players.find({ chatId }).toArray()
		return result.sort(
			(a, b) => b.playerLevel * 1000 + b.expCount - (a.playerLevel * 1000 + a.expCount)
		)
	}
	async ifUpdateLevel(
		ctx: CommandContext<Context>,
		messageFromId: number,
		messageFromChatId: number,
		lvlArr: number[]
	): Promise<void> {
		const user = await this.getOrCreateUser(messageFromId, messageFromChatId)

		if (user) {
			if (user.playerLevel + 1 > 10 && user.expCount >= user.newExp) {
				await this.updateUser(messageFromId, messageFromChatId, {
					playerLevel: user.playerLevel + 1,
					baglimit: user.baglimit + 15,
					newExp: user.newExp + 710
				})

				await ctx.reply(
					`<b>✨ Congratulations! ✨</b> \nYou have raised your level ! \n    🏅Your level: <b>${
						user.playerLevel + 1
					}</b> 🏅
					\n\n⬆️ Your bag capacity has been increased \n⬆️ More transactions per hour`,
					{
						parse_mode: 'HTML'
					}
				)
			} else if (user.playerLevel <= 10 && user.expCount >= user.newExp) {
				await this.updateUser(messageFromId, messageFromChatId, {
					playerLevel: user.playerLevel + 1,
					baglimit: user.baglimit + 5,
					expBarIndex: user.expBarIndex + 1,
					newExp: lvlArr[user.expBarIndex + 1]
				})

				if (
					user.playerLevel + 1 === 2 ||
					user.playerLevel + 1 === 4 ||
					user.playerLevel + 1 === 7
				) {
					await this.updateUser(messageFromId, messageFromChatId, {
						cooldown: user.cooldown - 2
					})

					await ctx.reply(
						`<b>✨ Congratulations! ✨</b> \nYou have raised your level ! \n  🏅Your level: <b>${
							user.playerLevel + 1
						}</b> 🏅
						\n\n⬆️ Your bag capacity has been increased \n⬆️ More trips to the mines are available to you`,
						{
							parse_mode: 'HTML'
						}
					)
				} else if (
					user.playerLevel + 1 === 3 ||
					user.playerLevel + 1 === 6 ||
					user.playerLevel + 1 === 8 ||
					user.playerLevel + 1 === 9
				) {
					await this.updateUser(messageFromId, messageFromChatId, {
						cooldown: user.cooldown - 1
					})

					await ctx.reply(
						`<b>✨ Congratulations! ✨</b> \nYou have raised your level ! \n  🏅Your level: <b>${
							user.playerLevel + 1
						}</b> 🏅
						\n\n⬆️ Your bag capacity has been increased \n⬆️ More trips to the mines are available to you`,
						{
							parse_mode: 'HTML'
						}
					)
				} else if (user.playerLevel + 1 === 5 || user.playerLevel + 1 === 10) {
					await this.updateUser(messageFromId, messageFromChatId, {
						cooldown: user.cooldown - 3
					})

					await ctx.reply(
						`<b>✨ Congratulations! ✨</b> \nYou have raised your level ! \n  🏅Your level: <b>${
							user.playerLevel + 1
						}</b> 🏅
						\n\n⬆️ Your bag capacity has been increased \n⬆️ More trips to the mines are available to you`,
						{
							parse_mode: 'HTML'
						}
					)
				}
			}
		} else {
			console.error('User not found!')
			return
		}
	}

	async ensurePlayerExists(
		playerId: Player['userId'],
		chatId: Player['chatId']
	): Promise<Player | null> {
		return this.players.findOne({ userId: playerId, chatId: chatId })
	}

	async sortAllSenders(chatId: Player['chatId']) {
		const result = await this.players.find({ chatId }).toArray()
		return result.sort(
			(a, b) =>
				b.counterOfSentCoins +
				b.amountOfSentCoins -
				(a.counterOfSentCoins + a.amountOfSentCoins)
		)
	}

	async sortAllReceivers(chatId: Player['chatId']) {
		const result = await this.players.find({ chatId }).toArray()
		return result.sort(
			(a, b) =>
				b.counterOfReceivedCoins +
				b.amountOfReceivedCoins -
				(a.counterOfReceivedCoins + a.amountOfReceivedCoins)
		)
	}

	async sortAllTheDonatedPlayers(chatId: Player['chatId']) {
		const result = await this.players.find({ chatId }).toArray()
		return result.sort(
			(a, b) =>
				b.counterOfDonatedCoins +
				b.amountOfDonatedCoins -
				(a.counterOfDonatedCoins + a.amountOfDonatedCoins)
		)
	}
}
