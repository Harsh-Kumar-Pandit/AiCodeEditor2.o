export const chunkCode = (content, chunkSize = 1200, overlap = 200) => {
    const chunks = [];

    let start = 0;

    while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);

        const chunk = content.slice(start, end);

        chunks.push(chunk);

        if (end === content.length) {
            break;
        }

        start = end - overlap;
    }

    return chunks;
};