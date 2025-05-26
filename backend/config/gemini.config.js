import { GEMINI_CONFIG } from "../constants/env.js";

const geminiConfig = {
    apiKey: GEMINI_CONFIG.apiKey,
    modelName: GEMINI_CONFIG.modelName,
};

if (!geminiConfig.apiKey) {
    console.warn("Gemini API key not found. Set GEMINI_API_KEY environment variable.");
}

if (!geminiConfig.modelName) {
    console.warn("Gemini model name not found. Set GEMINI_MODEL_NAME environment variable.");
}

export default geminiConfig;