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

export async function randomSituationInMines(
	heroName: string,
	gems: number,
	exp: number,
	location: any
) {
	let situations: string
	let result: string
	let photoPath: string
	let generatedText: string
	let textPrompt: string

	if (gems > 0) {
		// Text generation with OpenAI
		textPrompt = location
			? `Write a unique story about the ${heroName} in the location ${location} . ` +
				`The story should be completely based on the specifics of this location. ` +
				`You must mention something very specific that could only happen in this location. ` +
				`You can use any characters or details that could have happened there. ` +
				`"${heroName}" found ${gems}💎, mention it in the story. ` +
				`Only if the location name contains foul language, then you can also use foul language and write a story with it. ` +
				`Be sure to answer in the same language of communication as the name of the place was written.`
			: `${heroName} is in the mine. Write a short, unique story where they find ${gems}💎 .`

		generatedText = await generateText(textPrompt)
		situations =
			generatedText == 'Error receiving from OpenAI API' ||
			generatedText == 'Text not returned'
				? `${heroName} ` + goodSituations[randomInteger(0, goodSituations.length - 1)]
				: generatedText
		result = `You received:  ${gems}💎 and ${exp}⭐️`
		photoPath = 'src/Pictures/gemsFound.png'
	} else if (gems < 0) {
		gems *= -1
		textPrompt = location
			? `Write a unique story about the ${heroName} in the location ${location} . ` +
				`The story should be completely based on the specifics of this location. ` +
				`You must mention something very specific that could only happen in this location. ` +
				`You can use any characters or details that could have happened there. ` +
				`"${heroName}" lost ${gems}💎, mention it in the story. ` +
				`Only if the location name contains foul language, then you can also use foul language and write a story with it. ` +
				`Be sure to answer in the same language of communication as the name of the place was written.`
			: `${heroName} is in the mine. Write a short, unique story where they lost ${gems}💎 .`

		generatedText = await generateText(textPrompt)
		situations =
			generatedText == 'Error receiving from OpenAI API' ||
			generatedText == 'Text not returned'
				? `${heroName} ` + badSituations[randomInteger(0, badSituations.length - 1)]
				: generatedText
		result = `You received:  -${gems}💎 and ${exp}⭐️`
		photoPath = 'src/Pictures/gemsLost.png'
	} else {
		textPrompt = location
			? `Write a unique story about the ${heroName} in the location ${location} . ` +
				`The story should be completely based on the specifics of this location. ` +
				`You must mention something very specific that could only happen in this location. ` +
				`You can use any characters or details that could have happened there. ` +
				`"${heroName}" could not find any gems, mention this in the story, clearly stating that they found nothing. ` +
				`Only if the location name contains foul language, then you can also use foul language and write a story with it. ` +
				`Be sure to answer in the same language of communication as the name of the place was written.`
			: `${heroName} is in the mine. Write a short, unique story in which they does not find gem.`

		generatedText = await generateText(textPrompt)
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
