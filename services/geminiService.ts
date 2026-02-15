
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UNIVERSAL_CONSTANTS } from "../constants";

// Fix: instantiate inside the function for fresh context and use process.env.API_KEY directly
export const getRelativisticInsight = async (velocity: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fractionOfC = (velocity / UNIVERSAL_CONSTANTS.CONSTANT_C).toFixed(4);
  const prompt = `You are the ship's Quantum Navigation AI. The ship is currently traveling at ${velocity.toFixed(2)} units/s, which is ${fractionOfC} of the speed of light. 
  Briefly explain a relativistic effect occurring at this speed (like time dilation, length contraction, or Doppler shift) in a futuristic, immersive way. Keep it under 2 sentences.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });
    // Fix: Access the text property directly (it is a getter, not a method)
    return response.text || "Relativity sensors fluctuating. Analysis incomplete.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with the Quantum Mesh. Relativity sensors offline.";
  }
};
