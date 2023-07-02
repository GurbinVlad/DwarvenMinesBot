import { Player } from './types.js';
import { Collection, MongoClient } from 'mongodb';
import { randomName } from "../utilities.js";
import { CommandContext, Context } from "grammy";


export class Database {
    private client: MongoClient;
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


    async getOrCreateUser( userId: Player['userId'], chatId: Player['chatId'] ): Promise<Player> {
        let result = await this.players.findOne({ userId, chatId } );
        if (result === null) {
            await this.players.insertOne(
                { userId, chatId, cooldown: 24, baglimit: 100, heroName: randomName(), playerLevel: 1, expCount: 0,
                    newExp: 20, expBarIndex: 0, gemsCount: 0, moneyCount: 0, lastMined: new Date(0) } );

            return await this.getOrCreateUser(userId, chatId);
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


    async findAllRichestUsers( chatId: Player['chatId'] ){
        let result = await this.players.find({ chatId } ).toArray();
        return result.sort((a, b) => (b.gemsCount * 5 + b.moneyCount) - (a.gemsCount * 5 + a.moneyCount) );
    }


     async findAllExperiencedUsers( chatId: Player['chatId'] ){
         let result = await this.players.find({ chatId } ).toArray();
         return result.sort((a, b) => (b.playerLevel * 1000 + b.expCount) - (a.playerLevel * 1000 + a.expCount) );
     }


    async ifUpdateLevel( ctx: CommandContext<Context>, messageFromId: number, messageFromChatId: number, lvlArr: number[] ): Promise<void> {

        const user = await this.getOrCreateUser( messageFromId, messageFromChatId );

        if( user ) {

            if ( user.playerLevel + 1 > 10 && user.expCount >= user.newExp ) {

                await this.updateUser(messageFromId, messageFromChatId, {

                    playerLevel: user.playerLevel + 1,
                    baglimit: user.baglimit + 15,
                    newExp: user.newExp + 510 } );

                await ctx.reply(`✨ Congratulations! ✨ \nYou have raised your level. \n     🏅Your level: ${ user.playerLevel + 1 } \n\n📍Your bag capacity has been increased`);

            } else if ( user.playerLevel <= 10 && user.expCount >= user.newExp ) {

                            await this.updateUser( messageFromId, messageFromChatId, {

                                playerLevel: user.playerLevel + 1,
                                baglimit: user.baglimit + 5,
                                expBarIndex: user.expBarIndex + 1,
                                newExp: lvlArr[ user.expBarIndex + 1 ] } );

                            if( user.playerLevel + 1 === 2 || user.playerLevel + 1 === 4 || user.playerLevel + 1 === 7 ) {
                                await this.updateUser( messageFromId, messageFromChatId, { cooldown: user.cooldown - 2 } );
                                await ctx.reply(`✨ Congratulations! ✨ \nYou have raised your level. \n     🏅Your level: ${ user.playerLevel + 1 } \n\n📍Your bag capacity has been increased \n📍More trips to the mines are available to you` );
                            } else if( user.playerLevel + 1 === 3 || user.playerLevel + 1 === 6 || user.playerLevel + 1 === 8 || user.playerLevel + 1 === 9 ) {
                                await this.updateUser( messageFromId, messageFromChatId, { cooldown: user.cooldown - 1 } );
                                await ctx.reply(`✨ Congratulations! ✨ \nYou have raised your level. \n     🏅Your level: ${ user.playerLevel + 1 } \n\n📍Your bag capacity has been increased \n📍More trips to the mines are available to you` );
                            } else if( user.playerLevel + 1 === 5 || user.playerLevel + 1 === 10 ) {
                                await this.updateUser( messageFromId, messageFromChatId, { cooldown: user.cooldown - 3 } );
                                await ctx.reply(`✨ Congratulations! ✨ \nYou have raised your level. \n     🏅Your level: ${ user.playerLevel + 1 } \n\n📍Your bag capacity has been increased \n📍More trips to the mines are available to you` );
                            }
                }

        } else {
            console.error('User not found!');
            return;
        }
    }
}