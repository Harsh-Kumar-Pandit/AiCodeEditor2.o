
import {
    searchSimilarChunks,
    searchKeywordChunks
} from "./search.js";

import { generateAIResponse } from "../ai/aiProvider.js";

export const retrieveRepositoryContext = async ({
    repositoryId,
    question
}) => {
    const semanticChunks = await searchSimilarChunks({
        repositoryId,
        query: question,
        limit: 10
    });

    const keywordChunks = await searchKeywordChunks({
        repositoryId,
        query: question,
        limit: 10
    });

    const chunks = [
        ...semanticChunks,
        ...keywordChunks
    ];

    const uniqueChunks = Array.from(
        new Map(
            chunks.map((chunk) => [chunk.id, chunk])
        ).values()
    );

    const semanticRank = new Map(
        semanticChunks.map((chunk, index) => [
            chunk.id,
            index + 1
        ])
    );

    const keywordRank = new Map(
        keywordChunks.map((chunk, index) => [
            chunk.id,
            index + 1
        ])
    );

    const rankedChunks = uniqueChunks
        .map((chunk) => {
            const semanticPosition = semanticRank.get(chunk.id);
            const keywordPosition = keywordRank.get(chunk.id);

            const semanticScore = semanticPosition
                ? 1 / (60 + semanticPosition)
                : 0;

            const keywordScore = keywordPosition
                ? 1 / (60 + keywordPosition)
                : 0;

            return {
                ...chunk,
                finalScore: semanticScore + keywordScore
            };
        })
        .sort((a, b) => b.finalScore - a.finalScore);

    const selectedFiles = new Set();

    const finalChunks = rankedChunks
        .filter((chunk) => {
            if (selectedFiles.has(chunk.filePath)) {
                return false;
            }

            selectedFiles.add(chunk.filePath);
            return true;
        })
        .slice(0, 10);

    const context = finalChunks
        .map(
            (chunk, index) =>
                `Code Context ${index + 1}
File: ${chunk.filePath}
Code:
${chunk.content}`
        )
        .join("\n\n");

    const sources = finalChunks.map((chunk) => ({
        filePath: chunk.filePath,
        similarity: chunk.similarity,
        keywordScore: chunk.keyword_score,
        finalScore: chunk.finalScore
    }));

    return {
        context,
        sources
    };
};

export const askRepository = async ({
    repositoryId,
    question
}) => {
    const { context, sources } =
        await retrieveRepositoryContext({
            repositoryId,
            question
        });

    const response = await generateAIResponse([
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
        sources
    };
};
