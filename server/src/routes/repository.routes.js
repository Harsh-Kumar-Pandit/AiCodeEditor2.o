import express from "express";
import prisma from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getUserRepositories } from "../services/github/repositories.js";
import { indexRepository } from "../services/rag/repositoryIndexer.js";

const router = express.Router();

router.post("/:owner/:repo/index", requireAuth, async (req, res) => {
    try {
        const { owner, repo } = req.params;
        const { branch = "main" } = req.body;

        const result = await indexRepository({
            userId: req.userId,
            owner,
            repo,
            branch
        });

        res.json(result);
    } catch (error) {
        console.error("Repository indexing failed:", error);

        res.status(500).json({
            message: "Failed to index repository"
        });
    }
});

router.get("/", requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: req.userId
            },
            select: {
                accessToken: true
            }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const repositories = await getUserRepositories(user.accessToken);

        res.json({
            repositories
        });
    } catch (error) {
        console.error(
            "Get repositories error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            message: "Failed to fetch repositories"
        });
    }
});

export default router;