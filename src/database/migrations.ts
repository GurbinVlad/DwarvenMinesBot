import { Collection, MongoClient } from 'mongodb';
import { Player } from "./types.js";

export class Migrations {
    async migrate() {

        if (!process.env.URL || !process.env.dbName) {
            console.error(`URL or dbName not found`);
            process.exit(1);
        }

        let client = new MongoClient(process.env.URL);
        await client.connect();

        let collection: Collection<Player> = client.db(process.env.dbName).collection('Players');

        let dataPlayers = await collection.find().toArray();
        let updateData;

        for (const user of dataPlayers) {
            if (user.expCount >= 20) {

                if (user.expCount >= 90 && user.expCount < 150) {
                    updateData = {
                        cooldown: 19,
                        playerLevel: 4,
                        baglimit: 115,
                        newExp: 150,
                        expBarIndex: 3,
                        lastMined: new Date(0)
                    };
                } else if (user.expCount >= 50 && user.expCount < 90) {
                    updateData = {
                        cooldown: 21,
                        playerLevel: 3,
                        baglimit: 110,
                        newExp: 90,
                        expBarIndex: 2,
                        lastMined: new Date(0)
                    };

                } else updateData = {
                    cooldown: 22,
                    playerLevel: 2,
                    baglimit: 105,
                    newExp: 50,
                    expBarIndex: 1,
                    lastMined: new Date(0)
                };

                await collection.updateOne(
                    { _id: user._id },
                    { $set: updateData }
                );

            } else {
                updateData = {
                    cooldown: 24,
                    playerLevel: 1,
                    baglimit: 100,
                    newExp: 20,
                    expBarIndex: 0,
                    lastMined: new Date(0)
                };

                await collection.updateOne(
                    { _id: user._id },
                    { $set: updateData }
                );
            }
        }

        await client.close();
    }
}
