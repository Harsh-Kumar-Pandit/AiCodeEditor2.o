import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { generateAIResponse } from "../services/ai/aiProvider.js";
import { askRepository } from "../services/rag/ragService.js";
import { proposeCodeChanges } from "../controllers/aiChanges.controller.js";

const router = express.Router();

router.post("/chat", requireAuth, async (req, res) => {
    try {
        const {
            message,
            file,
            code,
            repositoryStructure,
            repositoryId
        } = req.body;

        if (!message) {
            return res.status(400).json({
                message: "Message is required"
            });
        }

        if (repositoryId) {
            const result = await askRepository({
                repositoryId,
                question: message
            });

            return res.json(result);
        }

        const response = await generateAIResponse([
            {
                role: "system",
                content:
                    `You are RepoMind, an AI coding assistant.

Use ONLY the repository structure and code provided in the user message.

Rules:
- Do not invent files, folders, technologies, or functionality.
- Do not infer a programming language or framework unless the provided file names or code clearly support it.
- If the provided context is insufficient, explicitly say that the information is not available.
- Distinguish clearly between what is present in the repository and what is only a possibility.
- When describing the repository, rely on the provided repository structure.`
            },
            {
                role: "user",
                content: `
        Repository structure:
        ${JSON.stringify(repositoryStructure, null, 2)}
        
        Currently selected file:
        ${file || "No file selected"}

        Selected file code:
        ${code || "No code provided"}

        Question:
        ${message}
        `
            }
        ]);

        console.log("AI response ready:", response);

        res.json({
            response
        });
    } catch (error) {
        console.error(
            "AI chat error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            message: "Failed to generate AI response"
        });
    }
});

router.post("/changes", requireAuth, proposeCodeChanges);

export default router;