import prisma from "../../db/prisma.js";


export const deleteRepositoryChunks = async (repositoryId) => {
    const result = await prisma.$executeRaw`
        DELETE FROM "CodeChunk"
        WHERE "repositoryId" = ${repositoryId}
    `;

    return result;

};

export const getIndexedFilePaths = async (repositoryId) => {
    const results = await prisma.$queryRaw`
        SELECT DISTINCT "filePath"
        FROM "CodeChunk"
        WHERE "repositoryId" = ${repositoryId}
    `;

    return results.map((row) => row.filePath);
};

export const saveCodeChunk = async ({
    repositoryId,
    filePath,
    content,
    embedding
}) => {
    const vectorString = `[${embedding.join(",")}]`;

    const result = await prisma.$queryRaw`
        INSERT INTO "CodeChunk"
        (
            "id",
            "repositoryId",
            "filePath",
            "content",
            "embedding",
            "createdAt"
        )
        VALUES (
            gen_random_uuid(),
            ${repositoryId},
            ${filePath},
            ${content},
            ${vectorString}::vector,
            NOW()
        )
        RETURNING "id", "filePath";
    `;

    return result[0];
};

export const getRepositoryFileContent = async ({
    repositoryId,
    filePath
}) => {
    const chunks = await prisma.codeChunk.findMany({
        where: {
            repositoryId,
            filePath
        },
        orderBy: {
            createdAt: "asc"
        },
        select: {
            content: true
        }
    });

    if (chunks.length === 0) {
        return null;
    }

    return chunks.map((chunk) => chunk.content).join("");
};