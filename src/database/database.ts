import {Player} from './types.js';
import {Collection, MongoClient} from 'mongodb';
import {URL, dbName} from '../config.js'
import {randomName} from "../utilities.js";

export class Database {
    private client: MongoClient
    private players: Collection<Player>;

    constructor() {
        this.client = new MongoClient(URL)
        const mongoDb = this.client.db(dbName)
        this.players = mongoDb.collection('Players')
    }


    async connect() {
        try {
            await this.client.connect()
            console.log('Database connection successful Bro!')
        } catch (error) {
            console.error('Database connection failed Bro:', error)
            process.exit(1)
        }
    }

    async getOrCreateUser(userId: Player['userId'], chatId: Player['chatId']):Promise<Player>{
        let result = await this.players.findOne({userId, chatId});
        if (result === null){
            await this.players.insertOne({userId, chatId, heroName: randomName(), gemsCount: 0, lastMined: new Date(0)})
            return await this.getOrCreateUser(userId, chatId)
        }
        return result;
    }

    async updateUser(userId: Player['userId'], chatId: Player['chatId'], setName: string, gems: number): Promise<void> {
        await this.players.updateOne({userId, chatId},
            {$inc: { gemsCount: gems },
                    $set: { heroName: setName, lastMined: new Date() }})
    }
}



