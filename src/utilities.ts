import {
	characteristics,
	names,
	tempGems,
	tempExp,
	goodSituations,
	badSituations,
	neutralSituations
} from './templates.js'

export const MINUTE = 60 * 1000
export const HOUR = 1 * 60 * MINUTE

export function randomInteger(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomName() {
	const name = names[randomInteger(0, names.length - 1)]
	const characteristic =
		characteristics[randomInteger(0, characteristics.length - 1)]
	return `${name} ${characteristic}`
}

export function randomSituationInMines(
	heroName: string,
	gems: number,
	exp: number
) {
	let situations: string[]
	let result: string
	if (gems > 0) {
		situations = goodSituations
		result = `\n\nYou received:  ${tempGems} and ${tempExp}`
	} else if (gems < 0) {
		gems *= -1
		situations = badSituations
		result = `\n\nYou received:  -${tempGems} and ${tempExp}`
	} else {
		situations = neutralSituations
		result = `\n\nYou received: only ${tempExp}`
	}

	return `<b>${heroName}</b> ${
		situations[randomInteger(0, situations.length - 1)]
	} ${result}`
		.replaceAll(tempGems, `<b>${gems}💎</b>`)
		.replaceAll(tempExp, `<b>${exp} ⭐️</b>`)
}
