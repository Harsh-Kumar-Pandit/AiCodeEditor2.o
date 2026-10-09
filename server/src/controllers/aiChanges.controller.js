
import { generateCodeChanges } from "../services/ai/generateCodeChanges.js";

export const proposeCodeChanges = async (req, res) => {
    try {
        const { repositoryId, question } = req.body;

        if (
            typeof repositoryId !== "string" ||
            !repositoryId.trim() ||
            typeof question !== "string" ||
            !question.trim()
        ) {
            return res.status(400).json({
                message: "repositoryId and question are required."
            });
        }

        const result = await generateCodeChanges({
            repositoryId: repositoryId.trim(),
            question: question.trim()
        });

        return res.status(200).json(result);
    } catch (error) {
        console.error("Propose code changes error:", error);

        return res.status(500).json({
            message: "Failed to generate code changes."
        });
    }
};
