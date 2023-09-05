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

async function migrate() {
	const dataPlayers = await players.find().toArray()
	let updateData

	for (const user of dataPlayers) {
		////////////////// Add new fields or set new values for them //////////////////

		if (user.heroName == 'It was terrible when I') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 1 + 1 + 1 + 1 + 1,
				amountOfSentCoins: 5 + 5 + 123 + 6 + 10,
				counterOfReceivedCoins: 1,
				amountOfReceivedCoins: 123,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == '👑 Monke') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 0,
				amountOfSentCoins: 0,
				counterOfReceivedCoins: 1 + 1 + 1 + 1 + 1,
				amountOfReceivedCoins: 5 + 6 + 6 + 8 + 10,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == 'Sid') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 1,
				amountOfSentCoins: 6,
				counterOfReceivedCoins: 1 + 1,
				amountOfReceivedCoins: 5 + 7,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == 'Gangster') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 1,
				amountOfSentCoins: 123,
				counterOfReceivedCoins: 1,
				amountOfReceivedCoins: 123,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == 'Minecraft') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 1 + 1,
				amountOfSentCoins: 7 + 8,
				counterOfReceivedCoins: 0,
				amountOfReceivedCoins: 0,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == 'Slavutich') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 1,
				amountOfSentCoins: 19,
				counterOfReceivedCoins: 0,
				amountOfReceivedCoins: 0,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else if (user.heroName == 'Miner2000') {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 0,
				amountOfSentCoins: 0,
				counterOfReceivedCoins: 1,
				amountOfReceivedCoins: 19,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		} else {
			updateData = {
				lastSend: new Date(0),
				counterOfSentCoins: 0,
				amountOfSentCoins: 0,
				counterOfReceivedCoins: 0,
				amountOfReceivedCoins: 0,
				counterOfDonatedCoins: 0,
				amountOfDonatedCoins: 0
			}
		}

		await players.updateOne({ _id: user._id }, { $set: updateData })

		await chats.updateMany({}, { coinScheduledAt: new Date(2004) })

		///////////////////////////////////////////////////////////////////////////////

		/////////////////////////Changing experience data//////////////////////////////

		/*if (user.expCount >= 20) {

            if (user.expCount >= 90 && user.expCount < 150) {
                updateData = {
                    cooldown: 19,
                    playerLevel: 4,
                    baglimit: 25,
                    newExp: 150,
                    expBarIndex: 3,
                    lastMined: new Date(0)
                };

            } else if (user.expCount >= 50 && user.expCount < 90) {
                updateData = {
                    cooldown: 21,
                    playerLevel: 3,
                    baglimit: 20,
                    newExp: 90,
                    expBarIndex: 2,
                    lastMined: new Date(0)
                };

            } else updateData = {
                cooldown: 22,
                playerLevel: 2,
                baglimit: 15,
                newExp: 50,
                expBarIndex: 1,
                lastMined: new Date(0)
            };

            await players.updateOne(
                { _id: user._id },
                { $set: updateData }
            );

        } else {
            updateData = {
                cooldown: 24,
                playerLevel: 1,
                baglimit: 10,
                newExp: 20,
                expBarIndex: 0,
                lastMined: new Date(0)
            };

            await players.updateOne(
                { _id: user._id },
                { $set: updateData }
            );
        }*/

		///////////////////////////////////////////////////////////////////////////////////

		////////////////// To add a new field //////////////////

		/*updateData = {
            lastSend: new Date(0),
            counterOfSentCoins: 0,
            amountOfSentCoins: 0,
            counterOfReceivedCoins: 0,
            amountOfReceivedCoins: 0
        };

        await players.updateOne(
            { _id: user._id },
            { $set: updateData }
        );*/

		////////////////////////////////////////////////////////
	}
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
