import OpenAI from "openai";

export const generateAIResponse = async (messages) => {
    console.log("Sending request to OpenRouter...");

    const openrouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1"
    });

    const response = await openrouter.chat.completions.create({
        model: "openrouter/free",
        messages
    });

    console.log("OpenRouter response received.");

    return response.choices[0].message.content;
};
