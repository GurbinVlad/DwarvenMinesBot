import type { Database } from './database/database.js'
import { HOUR, MINUTE, randomInteger } from './utilities.js'
import time from 'node-schedule'

export class Schedule {
	/*private static roundDateNumber(date: Date) {
		return Number(new Date(date.toDateString()))
	}*/

	static async scheduleCoinDropForChat(
		database: Database,
		dropCoinFunc: (chatId: number) => void,
		initialDate: Date,
		chatId: number
	) {
		const randomInterval = randomInteger(0, 23) * HOUR + randomInteger(0, 59) * MINUTE
		const dayStart = initialDate

		dayStart.setHours(0)
		dayStart.setMinutes(0)

		const coinDropDate = new Date(Number(dayStart) + randomInterval)

		await database.updateChat(chatId, {
			coinScheduledAt: coinDropDate
		})

		time.scheduleJob(coinDropDate, () => dropCoinFunc(chatId))
		console.info(`Scheduled coins drop for chat ${chatId} at ${coinDropDate.toLocaleString()}`)
	}

	static async scheduleCoinDropForAllChats(
		database: Database,
		dropCoinFunc: (chatId: number) => void
	) {
		const chats = await database.getChats()

		for (const chat of chats) {
			// if (
			// 	this.roundDateNumber(chat.coinScheduledAt) === this.roundDateNumber(new Date())
			// ) {
			time.scheduleJob(chat.coinScheduledAt, () => dropCoinFunc(chat.chatId))
			console.info(
				`[STARTUP] Scheduled coin drop for chat ${
					chat.chatId
				} at ${chat.coinScheduledAt.toLocaleString()} !`
			)
			// } else {
			// 	await this.scheduleCoinDropForChat(
			// 		database,
			// 		dropCoinFunc,
			// 		new Date(),
			// 		chat.chatId
			// 	)
			// }
		}
	}
}
