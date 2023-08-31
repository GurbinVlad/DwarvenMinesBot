interface Player {
    userId: number
    chatId: number
    cooldown: number
    baglimit: number
    heroName : string
      playerLevel: number
      expCount: number
      newExp: number
      expBarIndex: number
    gemsCount: number
    moneyCount: number
    lastMined: Date
    lastSend: Date
      counterOfSentCoins: number
      amountOfSentCoins: number
      counterOfReceivedCoins: number
      amountOfReceivedCoins: number
      counterOfDonatedCoins: number
      amountOfDonatedCoins: number
    coinPicked: boolean
}

interface Chat {
    chatId: number
      bankBalance: number
      fundBalance: number
      fundCapacity: number
}

export { Player, Chat }