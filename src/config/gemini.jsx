import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyDYrTiOratfu4y3TmAZeQAI-tSB4ncMRCw";
const genAI = new GoogleGenerativeAI(apiKey);

// Function to list available models (for debugging)
async function listAvailableModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available models:", models);
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    return [];
  }
}

// Try multiple model names in sequence
const modelNames = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest", 
  "gemini-1.0-pro-latest",
  "gemini-pro",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-3-flash-preview",
  
];

let model = null;

async function initializeModel() {
  for (const modelName of modelNames) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      // Test if model works
      await testModel.generateContent("test");
      model = testModel;
      console.log(`Successfully initialized model: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`Model ${modelName} not available:`, error.message);
    }
  }
  throw new Error("No available Gemini models found");
}

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

async function runChat(prompt) {
  try {
    // Initialize model if not already done
    if (!model) {
      await initializeModel();
    }
    
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
    const responseText = await result.response.text();

    return responseText;
  } catch (error) {
    console.error("Error:", error);
    return "Sorry, something went wrong.";
  }
}

// Optional: List models when the module loads
listAvailableModels().then(models => {
  if (models.length > 0) {
    console.log("Models that support generateContent:");
    models.forEach(model => {
      if (model.supportedMethods?.includes('generateContent')) {
        console.log(`- ${model.name}`);
      }
    });
  }
});

export default runChat;
