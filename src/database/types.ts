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
}

export { Player }