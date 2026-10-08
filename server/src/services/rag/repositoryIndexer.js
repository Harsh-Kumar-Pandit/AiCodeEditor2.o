import { getGithubFileContent } from "./githubFileContent.js";
import { shouldIndexFile } from "./fileFilter.js";
import prisma from "../../db/prisma.js";
import { Octokit } from "octokit";
import {
    indexFile
} from "./indexer.js";
import {
    getIndexedFilePaths
} from "./codeChunkRepository.js";

export const indexRepository = async ({
    userId,
    owner,
    repo,
    branch
}) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            accessToken: true
        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    const octokit = new Octokit({
        auth: user.accessToken
    });

    console.log("Indexing repository:", {
        owner,
        repo,
        branch
    });

    const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: branch,
        recursive: "true"
    });

    const files = response.data.tree.filter(
        (item) => item.type === "blob"
    );

    console.log("Files found:", files.length);

    const indexableFiles = files.filter(
        (file) => shouldIndexFile(file.path)
    );

    console.log("Indexable files:", indexableFiles.length);

    const filesWithContent = [];

    for (const file of indexableFiles) {
        try {
            const result = await getGithubFileContent({
                userId,
                owner,
                repo,
                path: file.path,
                branch
            });

            filesWithContent.push({
                path: result.path,
                content: result.content
            });

            console.log("Fetched:", result.path);
        } catch (error) {
            console.error(
                "Failed to fetch:",
                file.path,
                error.message
            );
        }
    }

    console.log(
        "Files with content:",
        filesWithContent.length
    );

    const repositoryId = `${owner}/${repo}`;

    const indexedFilePaths = await getIndexedFilePaths(
        repositoryId
    );

    console.log(
        "Already indexed files:",
        indexedFilePaths.length
    );

    // console.log("Removing previous repository chunks...");

    // const deletedChunks = await deleteRepositoryChunks(
    //     repositoryId
    // );

    // console.log(
    //     "Previous chunks removed:",
    //     deletedChunks
    // );

    let totalChunks = 0;

    for (const file of filesWithContent) {
        if (indexedFilePaths.includes(file.path)) {
            console.log("Skipping already indexed:", file.path);
            continue;
        }

        try {
            const chunks = await indexFile({
                repositoryId,
                filePath: file.path,
                content: file.content
            });

            totalChunks += chunks.length;

            console.log(
                `Indexed: ${file.path} → ${chunks.length} chunks`
            );
        } catch (error) {
            console.error(
                `Failed to index: ${file.path}`,
                error.message
            );
        }
    }
    console.log(
        "Total chunks indexed:",
        totalChunks
    );

    return {
        repositoryId,
        filesIndexed: filesWithContent.length,
        chunksIndexed: totalChunks
    };
};