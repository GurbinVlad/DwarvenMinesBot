/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Collection } from 'mongodb'
import { MongoClient } from 'mongodb'
import type { Player } from './types.js'
import { config } from 'dotenv'

config()

if (!process.env.URL || !process.env.dbName) {
	console.error('URL or dbName not found')
	process.exit(1)
}

const client = new MongoClient(process.env.URL)
const players: Collection<Player> = client.db(process.env.dbName).collection('Players')
const chats: Collection<Player> = client.db(process.env.dbName).collection('Chats')

async function addTransferData() {
	await players.updateMany(
		{},
		{
			$set: {
				counterOfSentCoins: 0,
				amountOfSentCoins: 0,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0,
				counterOfReceivedCoins: 0,
				amountOfReceivedCoins: 0
			}
		}
	)

	for (const data of [
		{ sender: 625056129, receiver: 849670500, amount: 5 },
		{ sender: 625056129, receiver: 1962463011, amount: 5 },
		{ sender: 426043802, receiver: 625056129, amount: 123 },
		{ sender: 625056129, receiver: 426043802, amount: 123 },
		{ sender: 625056129, receiver: 849670500, amount: 6 },
		{ sender: 1962463011, receiver: 849670500, amount: 6 },
		{ sender: 538001026, receiver: 1962463011, amount: 7 },
		{ sender: 538001026, receiver: 849670500, amount: 8 },
		{ sender: 290978290, receiver: 660830829, amount: 19 },
		{ sender: 625056129, receiver: 849670500, amount: 10 },
		{ sender: 625056129, receiver: 849670500, amount: 5 },
		{ sender: 625056129, receiver: 849670500, amount: 10 },
		{ sender: 625056129, receiver: 596572471, amount: 9 },
		{ sender: 290978290, receiver: 596572471, amount: 9 },
		{ sender: 625056129, receiver: 849670500, amount: 50 },
		{ sender: 664671499, receiver: 849670500, amount: 5 },
		{ sender: 1962463011, receiver: 849670500, amount: 10 },
		{ sender: 486895418, receiver: 849670500, amount: 10 },
		{ sender: 538001026, receiver: 849670500, amount: 16 },
		{ sender: 426043802, receiver: 849670500, amount: 9 },
		{ sender: 538001026, receiver: 1962463011, amount: 20 },
		{ sender: 290978290, receiver: 1962463011, amount: 10 },
		{ sender: 596572471, receiver: 849670500, amount: 10 },
		{ sender: 625056129, receiver: 426043802, amount: 25 },
		{ sender: 290978290, receiver: 849670500, amount: 1650 },
		{ sender: 849670500, receiver: 538001026, amount: 20 },
		{ sender: 290978290, receiver: 664671499, amount: 5 }
	]) {
		await players.updateOne(
			{ userId: data.sender, chatId: -1001459050125 },
			{
				$inc: {
					counterOfSentCoins: 1,
					amountOfSentCoins: data.amount
				}
			}
		)
		await players.updateOne(
			{ userId: data.receiver, chatId: -1001459050125 },
			{
				$inc: {
					counterOfReceivedCoins: 1,
					amountOfReceivedCoins: data.amount
				}
			}
		)
	}
}

async function addCoinScheduleTime() {
	await chats.updateMany(
		{},
		{
			$set: {
				coinScheduledAt: new Date(2004)
			}
		}
	)
}

async function setBankAndFundBalances() {
	const toBankAmount = (amount: number) => {
		if (amount < 100) {
			return Math.floor(1 + (amount * 2) / 100)
		} else if (amount >= 100 && amount < 200) {
			return Math.floor(amount / 100)
		} else {
			return Math.floor((amount * 0.5) / 100)
		}
	}
	const groups = await chats.find().toArray()
	for (const group of groups) {
		const userList = await players.find({ chatId: group?.chatId }).toArray()
		const totalSent = userList.reduce(
			(balance, user) => balance + toBankAmount(user.amountOfSentCoins),
			0
		)
		await chats.updateOne({ chatId: group.chatId }, { $inc: { bankBalance: totalSent } })
	}
}

const migrate = async () => {
	// await addTransferData()
	// await addCoinScheduleTime()
	await setBankAndFundBalances()
}

try {
	console.info(
		'\n\n-------------------------------------\n' + 'Database connection for migration...'
	)
	await client.connect()
} catch (error) {
	console.info('Database connection for migration failed! :', error)
	process.exit(1)
}

try {
	console.info('Running migration...')
	await migrate()
} catch (error) {
	console.info('Migration failed! :', error)
	process.exit(1)
}

try {
	console.info('Disconnecting...')
	await client.close()
	console.info('Done!' + '\n-------------------------------------\n')
} catch (error) {
	console.error('Disconnection failed!: ', error)
	process.exit(1)
}
