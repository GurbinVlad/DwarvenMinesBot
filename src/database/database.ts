import { Player } from './types.js';
import { Collection, MongoClient } from 'mongodb';
import { randomName } from "../utilities.js";
import { CommandContext, Context } from "grammy";


 export class Database {
    private client: MongoClient
    private players: Collection<Player>;

    constructor() {
        if (!process.env.URL || !process.env.dbName) {
            console.error(`URL or dbName not found`);
            process.exit(1);
        }

        this.client = new MongoClient(process.env.URL)
        const mongoDb = this.client.db(process.env.dbName)
        this.players = mongoDb.collection('Players')
    }


    async connect(){
        try {
            await this.client.connect()
            console.log('Database connection successful Bro!')
        } catch (error) {
            console.error('Database connection failed Bro:', error)
            process.exit(1)
        }
    }

    async getOrCreateUser(userId: Player['userId'], chatId: Player['chatId']): Promise<Player> {
        let result = await this.players.findOne({ userId, chatId } );
        if (result === null){
            await this.players.insertOne({ userId, chatId, heroName: randomName(), playerLevel: 1, expCount: 0, newExp:50, gemsCount: 0, moneyCount:0, lastMined: new Date(0) } )
            return await this.getOrCreateUser(userId, chatId)
        }
        return result;
    }

    async updateUser(userId: Player['userId'], chatId: Player['chatId'], allFields: Partial<Player>): Promise<void> {
        await this.players.updateOne(
              { userId, chatId },
            { $set: allFields } );
    }

    async checkUniqueName(chatId: Player['chatId'], setName: string){
        const players = await this.players.find({ chatId } ).toArray();
        return players.some( (player) => player.heroName === setName);
    }

    async findAllUsers(chatId: Player['chatId']){
        let result = await this.players.find({ chatId } ).toArray();
        return result.sort((a, b) => (b.gemsCount * 5 + b.moneyCount) - (a.gemsCount * 5 + a.moneyCount) );
    }

    async updateLevel(ctx: CommandContext<Context>, messageFromId: number, messageFromChatId: number, exp: number): Promise<void> {
        const lvl = await this.getOrCreateUser( messageFromId, messageFromChatId );

        if(lvl) {
            lvl.expCount + exp;

            if (lvl.expCount == lvl.newExp) {
                await this.updateUser(messageFromId, messageFromChatId, {
                    playerLevel: lvl.playerLevel + 1,
                    newExp: lvl.newExp + 50,
                    expCount: 0 } );
                ctx.reply(`✨ Congratulations! ✨ \nYou have raised your level. \n🏅 Your level: ${ lvl.playerLevel + 1 }` );
            }
        } else {
            console.log('Error in function updateLevel()!');
            return;
        }
    }

}