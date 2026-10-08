import "dotenv/config";
import prisma from "./src/db/prisma.js";

const repositoryId = "Harsh-Kumar-Pandit/RepoMind";

const results = await prisma.$queryRaw`
    SELECT
        "filePath",
        COUNT(*)::int AS "chunkCount"
    FROM "CodeChunk"
    WHERE "repositoryId" = ${repositoryId}
    GROUP BY "filePath"
    ORDER BY "filePath"
`;

console.log("Indexed files:", results.length);

for (const row of results) {
    console.log(`${row.filePath} → ${row.chunkCount} chunks`);
}

await prisma.$disconnect();