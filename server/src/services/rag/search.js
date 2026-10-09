import prisma from "../../db/prisma.js";
import { generateEmbedding } from "./embeddings.js";

export const searchSimilarChunks = async ({
    repositoryId,
    query,
    limit = 10
}) => {
    const queryEmbedding = await generateEmbedding(query);

    const vectorString = `[${queryEmbedding.join(",")}]`;

    const results = await prisma.$queryRaw`
        SELECT
            "id",
            "filePath",
            "content",
            1 - ("embedding" <=> ${vectorString}::vector) AS similarity
        FROM "CodeChunk"
        WHERE "repositoryId" = ${repositoryId}
        ORDER BY "embedding" <=> ${vectorString}::vector
        LIMIT ${limit * 5};
    `;

    const boostedResults = results
        .map((result) => {
            const isCodeFile = [
                ".js",
                ".jsx",
                ".ts",
                ".tsx",
                ".py",
                ".java",
                ".c",
                ".cpp"
            ].some((extension) =>
                result.filePath.toLowerCase().endsWith(extension)
            );

            return {
                ...result,
                adjustedSimilarity:
                    Number(result.similarity) + (isCodeFile ? 0.03 : 0)
            };
        })
        .sort(
            (a, b) =>
                b.adjustedSimilarity - a.adjustedSimilarity
        );

    console.log(
        "RAG search results:",
        boostedResults.map((result) => ({
            filePath: result.filePath,
            similarity: Number(result.similarity),
            adjustedSimilarity: result.adjustedSimilarity
        }))
    );

    return boostedResults.slice(0, limit);
};

export const searchKeywordChunks = async ({
    repositoryId,
    query,
    limit = 20
}) => {

    const keywords = query
        .toLowerCase()
        .split(/\s+/)
        .map((word) => word.replace(/[^a-z0-9_]/g, ""))
        .filter((word) => word.length >= 3);

    const tsQuery = keywords.join(" | ");

    const results = await prisma.$queryRaw`
        SELECT
            "id",
            "filePath",
            "content",
            ts_rank(
                to_tsvector(
                    'english',
                    "filePath" || ' ' || "content"
                ),
                to_tsquery('english', ${tsQuery})
            ) AS keyword_score
        FROM "CodeChunk"
        WHERE "repositoryId" = ${repositoryId}
          AND to_tsvector(
                'english',
                "filePath" || ' ' || "content"
              )
              @@ to_tsquery('english', ${tsQuery})
        ORDER BY keyword_score DESC
        LIMIT ${limit};
    `;

    return results;
};