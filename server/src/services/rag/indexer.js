import { chunkCode } from "./chunker.js";
import { generateEmbedding } from "./embeddings.js";
import { saveCodeChunk } from "./codeChunkRepository.js";

export const indexFile = async ({
    repositoryId,
    filePath,
    content
}) => {
    const chunks = chunkCode(content);
    const indexedChunks = [];

    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.content);

        const savedChunk = await saveCodeChunk({
            repositoryId,
            filePath,
            content: chunk.content,
            chunkIndex: chunk.index,
            embedding
        });

        indexedChunks.push(savedChunk);
    }

    return indexedChunks;
};