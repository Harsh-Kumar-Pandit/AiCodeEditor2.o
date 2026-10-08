import "dotenv/config";
import { getGithubFileContent } from "./src/services/rag/githubFileContent.js";

try {
    const result = await getGithubFileContent({
        userId: "cmub20ega0000f3asjqo1itdw",
        owner: "Harsh-Kumar-Pandit",
        repo: "RepoMind",
        path: "server/src/middleware/auth.middleware.js",
        branch: "main"
    });

    console.log("File:", result.path);
    console.log("\nContent:\n");
    console.log(result.content);
} catch (error) {
    console.error(
        "GitHub file fetch failed:",
        error.response?.data || error.message
    );
}