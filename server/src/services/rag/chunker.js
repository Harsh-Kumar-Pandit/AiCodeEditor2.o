export const chunkCode = (
    content,
    chunkSize = 1200,
    overlap = 200
) => {
    const chunks = [];
    let start = 0;
    let index = 0;

    while (start < content.length) {
        const end = Math.min(start + chunkSize, content.length);

        chunks.push({
            index,
            content: content.slice(start, end)
        });

        if (end === content.length) break;

        start = end - overlap;
        index++;
    }

    return chunks;
};