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
					role: 'system',
					content:
						'You create short, unique one-sentence stories about the events that happen to the gnomes in the mine.' +
						'Each story should be creative and accurate.' +
						'The number of gems must be mentioned in the story (for example, 10💎).'
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
