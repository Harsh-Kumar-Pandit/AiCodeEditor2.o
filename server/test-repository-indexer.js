import "dotenv/config";

import { indexRepository } from "./src/services/rag/repositoryIndexer.js";

try {
    const result = await indexRepository({
        userId: "cmub20ega0000f3asjqo1itdw",
        owner: "Harsh-Kumar-Pandit",
        repo: "RepoMind",
        branch: "main"
    });

    console.log("\nIndexing result:\n");
    console.log(result);

} catch (error) {
    console.error("Indexer test failed:", error);
}