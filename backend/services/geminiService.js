import { GoogleGenerativeAI } from "@google/generative-ai";
import geminiConfig from "../config/gemini.config.js";

let geminiModel;

function initializeGeminiClient() {
  if (!geminiConfig.apiKey) {
    console.warn(
      "Gemini API key is a placeholder or not properly set in environment. Recommendation features may not work."
    );
    return false;
  }
  try {
    const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);
    geminiModel = genAI.getGenerativeModel({ model: geminiConfig.modelName });
    console.log("Gemini AI client initialized successfully.");
    return true;
  } catch (e) {
    console.error("Error initializing Gemini AI client:", e);
    geminiModel = null; // Ensure model is null if init fails
    return false;
  }
}

async function getRecommendationsFromGemini(relevantEvents) {
  if (!geminiModel) {
    throw new Error(
      "Gemini AI client not initialized. Cannot get recommendations."
    );
  }

  const prompt = `
Based on the following user activity, please recommend a few products.
The user's recent relevant actions (add_to_cart, remove_from_cart, add_to_wishlist, remove_from_wishlist) are:
${JSON.stringify(relevantEvents, null, 2)}

Please provide a short list of product IDs that would be good recommendations for this user.
Format the response as a JSON array of product IDs, like ["product_abc", "product_xyz"].
Also, provide a very short, one-line overall comment about the user's preferences or buying signals based on this activity. Example: "User seems interested in electronics and has recently added a high-end camera to their cart."

Return a JSON object with two keys: "recommendations" (an array of product IDs) and "comment" (a string).
Ensure the output is a single, valid JSON object.
    `;

  try {
    // console.log("Prompt to Gemini:", prompt); // For debugging
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log("Gemini Raw Response:", text); // For debugging

    let recommendationsResponse;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      recommendationsResponse = JSON.parse(jsonMatch[1]);
    } else {
      const cleanedText = text.replace(/^```json\s*|```\s*$/g, "").trim();
      recommendationsResponse = JSON.parse(cleanedText);
    }
    return recommendationsResponse;
  } catch (error) {
    console.error("Error getting recommendations from Gemini:", error);
    console.error("Gemini Raw Text (if available):", error.text || "N/A");
    throw new Error("Failed to get or parse recommendations from AI.");
  }
}

export { initializeGeminiClient, getRecommendationsFromGemini };
