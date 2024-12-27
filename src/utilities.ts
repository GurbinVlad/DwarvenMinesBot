import {
	characteristics,
	names,
	tempGems,
	tempExp,
	goodSituations,
	badSituations,
	neutralSituations
} from './templates.js'
import { generateText } from './textModel.js'

export const MINUTE = 60 * 1000
export const HOUR = 60 * MINUTE

export function randomInteger(min: number, max: number) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomName() {
	const name = names[randomInteger(0, names.length - 1)]
	const characteristic = characteristics[randomInteger(0, characteristics.length - 1)]
	return `${name} ${characteristic}`
}

export async function randomSituationInMines(heroName: string, gems: number, exp: number) {
	let situations: string
	let result: string
	let photoPath: string

	if (gems > 0) {
		// Text generation with OpenAI
		const generatedText = await generateText(
			`${heroName} is in the mine. Write a short, unique story where he finds ${gems}💎`
		)
		situations =
			generatedText == 'Error receiving from OpenAI API' ||
			generatedText == 'Text not returned'
				? `${heroName} ` + goodSituations[randomInteger(0, goodSituations.length - 1)]
				: generatedText
		result = `You received:  ${gems}💎 and ${exp}⭐️`
		photoPath = 'src/Pictures/gemsFound.png'
	} else if (gems < 0) {
		gems *= -1
		const generatedText = await generateText(
			`${heroName} is in the mine. Write a short, unique story where he loses ${gems}💎`
		)
		situations =
			generatedText == 'Error receiving from OpenAI API' ||
			generatedText == 'Text not returned'
				? `${heroName} ` + badSituations[randomInteger(0, badSituations.length - 1)]
				: generatedText
		result = `You received:  -${gems}💎 and ${exp}⭐️`
		photoPath = 'src/Pictures/gemsLost.png'
	} else {
		const generatedText = await generateText(
			`${heroName} is in the mine. Write a short, unique story in which he does not find any 💎`
		)
		situations =
			generatedText == 'Error receiving from OpenAI API' ||
			generatedText == 'Text not returned'
				? `${heroName} ` + neutralSituations[randomInteger(0, neutralSituations.length - 1)]
				: generatedText
		result = `You received:  only ${exp}⭐️`
		photoPath = 'src/Pictures/nothingGemsFound.png'
	}

	return {
		message: `${situations} \n\n${result}`
			.replaceAll(tempGems, `<b>${gems}💎</b>`)
			.replaceAll(tempExp, `<b>${exp}⭐️</b>`)
			.replaceAll(heroName, `<b>${heroName}</b>`),
		photoPath
	}
}
