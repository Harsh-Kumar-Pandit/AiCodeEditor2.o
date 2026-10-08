import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

export const generateGeminiResponse = async (messages) => {
    const contents = messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }]
        }));

    const systemMessage = messages.find(
        (message) => message.role === "system"
    );

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents,
        config: {
            systemInstruction: systemMessage?.content
        }
    });

    return response.text;
};