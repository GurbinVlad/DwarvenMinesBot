import { ObjectId, Collection } from 'mongodb'

interface Player {
    _id: ObjectId
    userId: string
    chatId: string

    gemsCount: number
}

interface Database {
    players: Collection <Player>
}

export { Player, Database }