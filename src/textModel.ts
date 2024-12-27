import OpenAI from 'openai'
import { config } from 'dotenv'

config()

if (!process.env.API_KEY_OPENAI) {
	console.error('API_KEY_OPENAI not found!')
	process.exit(1)
}

// Initialising the OpenAI client
const openai = new OpenAI({
	apiKey: process.env.API_KEY_OPENAI
})

/**
 * Function for generating short texts
 * @param prompt Request from the user
 * @returns Generated text
 */

export const generateText = async (prompt: string): Promise<string> => {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini', // Model GPT-4o-mini
			messages: [
				{
					role: 'developer',
					content:
						'Instead of the words precious jewels, use only the emoticon 💎 in your story. Write the number of gems only in numerical form. ' +
						"Be sure to use the character's name in the story. " +
						'The story should be one sentence long.'
				},
				{ role: 'user', content: prompt }
			]
		})

		// Returning the reply text
		return response.choices[0].message?.content || 'Text not returned'
	} catch (error) {
		console.error('Error generating text (`generateText`) in textModel.ts: ', error)
		return 'Error receiving from OpenAI API'
	}
}
