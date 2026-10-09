
import { generateGeminiResponse } from "./gemini.js";
import { codeChangesSchema } from "./codeChange.schema.js";
import {
    retrieveRepositoryContext
} from "../rag/ragService.js";

export const generateCodeChanges = async ({
    repositoryId,
    question
}) => {
    const { context, sources } = await retrieveRepositoryContext({
        repositoryId,
        question
    });

    const messages = [
        {
            role: "system",
            content: `You are RepoMind, an AI coding assistant.

Analyze the user's request using the repository context.

Return ONLY valid JSON in this format:
{
  "changes": [
    {
      "operation": "modify_file",
      "path": "relative/path/to/file.js",
      "content": "complete updated file content"
    }
  ]
}

Rules:
- Use only files supported by the repository context.
- For modify_file, return the complete updated file content.
- Use create_file only for genuinely new files.
- Use delete_file only when explicitly requested.
- Do not include Markdown fences or explanations.
- Never invent existing file contents.
- If the context is insufficient, do not invent a solution.
- For modify_file, return the ENTIRE updated file, not a snippet,
  patch, explanation, or partial function.
- Preserve all existing code that is unrelated to the requested change.
- Never replace an entire file with only a small fragment.
- Only modify files whose contents are available in the repository context.
- If the full file content is unavailable, do not propose modifying that file.
- Before proposing a change, compare the proposed implementation
  with the existing code in the provided context.
- Do not propose a change if the relevant behavior is already implemented.
- Every modify_file proposal must introduce a meaningful change
  that directly addresses the user's request.
- If no meaningful improvement is needed, return:
  {"changes": []}
- Never change code merely to make a textual difference.`
        },
        {
            role: "user",
            content: `Repository context:
${context}

Request:
${question}`
        }
    ];

    const rawResponse = await generateGeminiResponse(messages);

    let parsedResponse;

    try {
        const cleanedResponse = rawResponse
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();

        parsedResponse = JSON.parse(cleanedResponse);
    } catch {
        throw new Error("AI returned invalid JSON for code changes.");
    }

    if (parsedResponse.changes?.length === 0) {
        return {
            changes: [],
            message: "The AI could not propose a safe change with the available context.",
            sources
        };
    }

    const validation = codeChangesSchema.safeParse(parsedResponse);

    if (!validation.success) {
        throw new Error(
            `Invalid AI change format: ${validation.error.message}`
        );
    }

    return {
        ...validation.data,
        sources
    };
};
