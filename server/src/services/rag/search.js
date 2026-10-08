import prisma from "../../db/prisma.js";
import { generateEmbedding } from "./embeddings.js";

export const searchSimilarChunks = async ({
    repositoryId,
    query,
    limit = 5
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
        LIMIT ${limit};
    `;

    return results;
};