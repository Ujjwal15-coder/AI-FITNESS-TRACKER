import { GoogleGenAI } from '@google/genai';
import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async analyzeImage(fileBuffer: Buffer, mimeType: string) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in the environment variables.');
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Analyze this image. If it contains food, identify the food name and estimate the calories for the portion shown. Return ONLY a valid JSON object with keys "foodName" (string) and "estimatedCalories" (number). Do not return markdown code blocks, just the JSON string.' },
              { inlineData: { mimeType: mimeType, data: fileBuffer.toString('base64') } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      let text = response.text;
      if (!text) {
        throw new Error('No response from Gemini.');
      }
      
      // Clean up potential markdown formatting (e.g. ```json ... ```) just in case
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const result = JSON.parse(text);
      return result;
    } catch (error) {
      console.error('Error in Gemini image analysis:', error);
      throw error;
    }
  }
});
