import { searchSimilarChunks } from "./search.js";
import { generateGeminiResponse } from "../ai/gemini.js";

export const askRepository = async ({
    repositoryId,
    question
}) => {
    const chunks = await searchSimilarChunks({
        repositoryId,
        query: question,
        limit: 5
    });

    const context = chunks
        .map(
            (chunk, index) =>
                `Code Context ${index + 1}
File: ${chunk.filePath}
Similarity: ${chunk.similarity}
Code:
${chunk.content}`
        )
        .join("\n\n");

    const response = await generateGeminiResponse([
        {
            role: "system",
            content: `You are RepoMind, an AI coding assistant.

Answer the user's question using the provided repository code context.

Rules:
- Use the provided code context as the source of truth.
- Do not invent files or code that are not present in the context.
- If the context does not contain enough information, say so.
- Mention relevant file paths when explaining the answer.`
        },
        {
            role: "user",
            content: `Repository code context:

${context}

Question:
${question}`
        }
    ]);

    return {
        response,
        sources: chunks.map((chunk) => ({
            filePath: chunk.filePath,
            similarity: chunk.similarity
        }))
    };
};