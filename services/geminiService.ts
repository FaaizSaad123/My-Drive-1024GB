import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI Client
// The API key is obtained from the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNanoBananaImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image which corresponds to the "Nano Banana" requirement
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini API");
    }

    const content = response.candidates[0].content;
    
    // Iterate through parts to find the image
    if (content && content.parts) {
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // If no image part found, log the text part if available
    const textPart = content?.parts?.find(p => p.text);
    if (textPart) {
      console.warn("Model returned text instead of image:", textPart.text);
    }
    
    return null;

  } catch (error) {
    console.error("Error generating image with Nano Banana:", error);
    throw error;
  }
};