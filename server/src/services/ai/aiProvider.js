import { generateGeminiResponse } from "./gemini.js";
import { generateAIResponse as generateOpenRouterResponse } from "./openrouter.js";

export const generateAIResponse = async (messages) => {
    try {
        console.log("Trying Gemini...");

        const response = await generateGeminiResponse(messages);

        console.log("Gemini succeeded.");

        return response;
    } catch (error) {
        console.error(
            "Gemini failed:",
            error.message
        );

        console.log("Falling back to OpenRouter...");

        const response = await generateOpenRouterResponse(messages);

        console.log("OpenRouter fallback succeeded.");

        return response;
    }
};