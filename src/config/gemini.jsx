import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// ✅ ALL models (ordered by priority)
const MODELS = [
  "gemini-3-flash-preview", // experimental (likely fail)
  "gemini-3-flash",         // may fail in v1beta
  "gemini-2.5-flash-lite",  // may fail
  "gemini-2.5-flash",       // may fail
  "gemini-1.5-flash",       // ✅ stable
  "gemini-1.5-pro"          // ✅ stable fallback
];

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function runChat(prompt) {
  for (let modelName of MODELS) {
    try {
      console.log("Trying model:", modelName);

      const model = genAI.getGenerativeModel({
        model: modelName,
      });

      const chatSession = await model.startChat({
        generationConfig,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.ALLOW_MEDIUM,
          },
        ],
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);
      const text = result.response.text();

      // ✅ extra safety: avoid empty response
      if (!text || text.trim() === "") {
        throw new Error("Empty response");
      }

      console.log("✅ Working model:", modelName);
      return text;

    } catch (error) {
      console.warn("❌ Failed model:", modelName, error.message);
      continue; // try next model
    }
  }

  return "All models failed. Try again later.";
}

export default runChat;
