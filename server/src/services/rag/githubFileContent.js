import { Octokit } from "octokit";
import prisma from "../../db/prisma.js";

export const getGithubFileContent = async ({
    userId,
    owner,
    repo,
    path,
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

    const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: branch
    });

    if (Array.isArray(response.data)) {
        throw new Error(`Path is a directory: ${path}`);
    }

    const content = Buffer.from(
        response.data.content,
        "base64"
    ).toString("utf-8");

    return {
        path: response.data.path,
        content
    };
};