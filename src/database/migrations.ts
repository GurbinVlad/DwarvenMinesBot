import { Collection, MongoClient } from 'mongodb';
import { Player } from "./types.js";
import { config } from "dotenv";

await config();

if (!process.env.URL || !process.env.dbName) {
    console.error(`URL or dbName not found`);
    process.exit(1);
}

const client = new MongoClient(process.env.URL);
const players: Collection<Player> = client.db(process.env.dbName).collection('Players');

async function migrate() {

    let dataPlayers = await players.find().toArray();
    let updateData;

    for (const user of dataPlayers) {
        if (user.expCount >= 20) {

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
        }
    }
}


try {
    console.info('\n\n-------------------------------------\n' + 'Database connection for migration...');
    await client.connect();
} catch (error) {
    console.info('Database connection for migration failed! :', error);
    process.exit(1);
}

try {
    console.info('Running migration...');
    await migrate();
} catch (error) {
    console.info('Migration failed! :', error);
    process.exit(1);
}

try {
    console.info('Disconnecting...');
    await client.close();
    console.info('Done!' + '\n-------------------------------------\n');
} catch (error) {
    console.error('Disconnection failed!: ', error);
    process.exit(1);
}