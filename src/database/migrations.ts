import { Collection, MongoClient } from 'mongodb';
import { Player } from "./types.js";


let client = new MongoClient('mongodb://127.0.0.1:27017');
let players: Collection<Player> = client.db('coursework').collection('Players');

async function migrate() {

    let dataPlayers = await players.find().toArray();
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

            await players.updateOne(
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