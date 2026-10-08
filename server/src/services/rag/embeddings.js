import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const generateEmbedding = async (text) => {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await ai.models.embedContent({
                model: "gemini-embedding-2",
                contents: {
                    parts: [{ text }]
                },
                config: {
                    outputDimensionality: 1536
                }
            });

            return response.embeddings[0].values;

        } catch (error) {
            console.error(
                `Embedding attempt ${attempt}/${maxAttempts} failed:`,
                error.message
            );

            if (attempt === maxAttempts) {
                throw error;
            }

            const delay = attempt * 2000;

            console.log(
                `Retrying embedding in ${delay / 1000}s...`
            );

            await new Promise((resolve) =>
                setTimeout(resolve, delay)
            );
        }
    }
};