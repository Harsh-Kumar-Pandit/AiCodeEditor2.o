
import { Octokit } from "octokit";
import prisma from "../../db/prisma.js";

export const commitChanges = async ({
    userId,
    owner,
    repo,
    baseBranch,
    newBranch,
    changes,
    message
}) => {
    if (!Array.isArray(changes) || changes.length === 0) {
        throw new Error("At least one change is required");
    }

    if (!/^[a-zA-Z0-9._/-]+$/.test(newBranch) ||
        newBranch.includes("..") ||
        newBranch.startsWith("/") ||
        newBranch.endsWith("/") ||
        newBranch.endsWith(".lock")) {
        throw new Error("Invalid branch name");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accessToken: true }
    });

    if (!user?.accessToken) {
        throw new Error("GitHub access token not found");
    }

    const octokit = new Octokit({
        auth: user.accessToken
    });

    const { data: baseRef } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`
    });

    const { data: baseCommit } = await octokit.rest.git.getCommit({
        owner,
        repo,
        commit_sha: baseRef.object.sha
    });

    const treeItems = [];

    for (const change of changes) {
        if (
            !["create_file", "modify_file", "delete_file"].includes(
                change.operation
            )
        ) {
            throw new Error("Unsupported file operation");
        }

        if (
            typeof change.path !== "string" ||
            !change.path.trim() ||
            change.path.startsWith("/") ||
            change.path.includes("\\") ||
            change.path.split("/").some(
                (part) => !part || part === "." || part === ".."
            ) ||
            change.path.split("/").some(
                (part) => part.toLowerCase() === ".git"
            )
        ) {
            throw new Error(`Invalid file path: ${change.path}`);
        }

        if (
            change.operation !== "delete_file" &&
            typeof change.content !== "string"
        ) {
            throw new Error(`Missing file content: ${change.path}`);
        }

        if (change.operation === "create_file") {
            try {
                await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: change.path,
                    ref: baseBranch
                });

                throw new Error(
                    `File already exists: ${change.path}`
                );
            } catch (error) {
                if (error.status !== 404) throw error;
            }
        }

        if (change.operation !== "create_file") {
            try {
                await octokit.rest.repos.getContent({
                    owner,
                    repo,
                    path: change.path,
                    ref: baseBranch
                });
            } catch (error) {
                if (error.status === 404) {
                    throw new Error(
                        `File does not exist: ${change.path}`
                    );
                }

                throw error;
            }
        }

        if (change.operation === "delete_file") {
            treeItems.push({
                path: change.path,
                sha: null
            });
        } else {
            treeItems.push({
                path: change.path,
                mode: "100644",
                type: "blob",
                content: change.content
            });
        }
    }

    const { data: tree } = await octokit.rest.git.createTree({
        owner,
        repo,
        base_tree: baseCommit.tree.sha,
        tree: treeItems
    });

    const { data: commit } = await octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree: tree.sha,
        parents: [baseCommit.sha]
    });

    await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${newBranch}`,
        sha: commit.sha
    });

    return {
        branch: newBranch,
        commitSha: commit.sha,
        url: commit.html_url
    };
};
