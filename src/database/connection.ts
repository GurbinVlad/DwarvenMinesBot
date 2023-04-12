import {Database, Player} from './types.js'

import {Collection, MongoClient} from 'mongodb'

import {URL} from '../token.js'

import {dbName} from '../token.js'


async function connectToDb() {
    const client = new MongoClient(URL)
    try {
        await client.connect()
        console.log('Database connection successful Bro!')
    } catch (error) {
        console.error('Database connection failed Bro:', error)
        process.exit(1)
    }
    const mongoDb = client.db(dbName)
    const players: Collection <Player> = mongoDb.collection('player')
    const dataBase: Database = { players }
    return dataBase
}

export { connectToDb }