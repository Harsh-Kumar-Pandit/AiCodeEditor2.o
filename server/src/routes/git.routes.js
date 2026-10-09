import prisma from "../db/prisma.js";
import { Octokit } from "octokit";
import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { commitChanges } from "../services/github/commitChanges.js";

const router = express.Router();

const commitRequestSchema = z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    baseBranch: z.string().min(1),
    newBranch: z.string().min(1),
    message: z.string().trim().min(1).max(200),
    changes: z.array(
        z.discriminatedUnion("operation", [
            z.object({
                operation: z.literal("create_file"),
                path: z.string().min(1),
                content: z.string()
            }),
            z.object({
                operation: z.literal("modify_file"),
                path: z.string().min(1),
                content: z.string()
            }),
            z.object({
                operation: z.literal("delete_file"),
                path: z.string().min(1)
            })
        ])
    ).min(1).max(50)
});


router.post("/branch", requireAuth, async (req, res) => {
    try {
        const { owner, repo, baseBranch = "main", newBranch } = req.body;

        if (
            typeof owner !== "string" ||
            !/^[a-zA-Z0-9-]+$/.test(owner) ||
            typeof repo !== "string" ||
            !/^[a-zA-Z0-9._-]+$/.test(repo) ||
            typeof baseBranch !== "string" ||
            !baseBranch.trim() ||
            typeof newBranch !== "string" ||
            !/^[a-zA-Z0-9._/-]+$/.test(newBranch) ||
            newBranch.includes("..") ||
            newBranch.startsWith("/") ||
            newBranch.endsWith("/") ||
            newBranch.endsWith(".lock")
        ) {
            return res.status(400).json({
                message: "Invalid repository or branch details"
            });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { accessToken: true }
        });

        if (!user?.accessToken) {
            return res.status(404).json({
                message: "GitHub access token not found"
            });
        }

        const octokit = new Octokit({ auth: user.accessToken });

        const { data: baseRef } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`
        });

        const result = await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${newBranch}`,
            sha: baseRef.object.sha
        });

        return res.status(201).json({
            message: "Branch created successfully",
            branch: newBranch,
            sha: result.data.object.sha,
            url: result.data.url
        });
    } catch (error) {
        console.error(
            "Branch creation error:",
            error.response?.data || error.message
        );

        return res.status(error.status === 422 ? 409 : 500).json({
            message: error.response?.data?.message || "Failed to create branch"
        });
    }
});


router.post("/commit", requireAuth, async (req, res) => {
    const validation = commitRequestSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            message: "Invalid commit request",
            errors: validation.error.issues
        });
    }

    try {
        const result = await commitChanges({
            userId: req.userId,
            ...validation.data
        });

        return res.status(201).json({
            message: "Changes committed to the new branch",
            ...result
        });
    } catch (error) {
        console.error("Git commit error:", error);

        return res.status(500).json({
            message: error.message || "Failed to commit changes"
        });
    }
});

export default router;
