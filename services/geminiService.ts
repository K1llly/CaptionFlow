import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Caption } from "../types";

// Convert file to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      // Remove data URL prefix (e.g., "data:video/mp4;base64,")
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      start: { type: Type.STRING, description: "Start time format HH:MM:SS.mmm" },
      end: { type: Type.STRING, description: "End time format HH:MM:SS.mmm" },
      text: { type: Type.STRING, description: "The transcribed text in Turkish" },
    },
    required: ["start", "end", "text"],
  },
};

export const generateCaptions = async (videoFile: File, apiKey: string): Promise<Caption[]> => {
  const key = apiKey || process.env.API_KEY;
  if (!key) throw new Error("API Key is missing. Please check your environment configuration.");

  const ai = new GoogleGenAI({ apiKey: key });
  // Using gemini-2.5-flash for best balance of speed and multimodal accuracy
  const modelId = "gemini-2.5-flash"; 

  try {
    const videoPart = await fileToGenerativePart(videoFile);

    const prompt = `
      You are an expert subtitler.
      
      CRITICAL FIX REQUIRED:
      Previous captions were 1-2 seconds LATE.
      You MUST timestamp the 'start' EXACTLY at the audio onset (the first sound/breath of the sentence).
      
      INSTRUCTIONS:
      1.  **Aggressive Start:** Bias the 'start' timestamp slightly EARLY. Do not wait for the word to be fully spoken.
      2.  **Sentence-Level:** Segment by complete sentences.
      3.  **Turkish Language:** Transcribe verbatim in Turkish.
      4.  **Format:** "HH:MM:SS.mmm".
      
      Example:
      [
        { "start": "00:00:00.000", "end": "00:00:01.500", "text": "Hızlı başlangıç yapıyoruz." }
      ]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [videoPart, { text: prompt }],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    let textResponse = response.text;
    if (!textResponse) throw new Error("No response text received from model.");

    // Sanitize response
    textResponse = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

    const rawData = JSON.parse(textResponse);
    
    // Robust mapping
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalizedCaptions: Caption[] = rawData.map((item: any, index: number) => {
        // Find keys case-insensitively
        const keys = Object.keys(item);
        const startKey = keys.find(k => k.toLowerCase().includes('start')) || 'start';
        const endKey = keys.find(k => k.toLowerCase().includes('end')) || 'end';
        const textKey = keys.find(k => k.toLowerCase().includes('text') || k.toLowerCase().includes('caption')) || 'text';

        let startVal = item[startKey];
        let endVal = item[endKey];

        // HEURISTIC FIX: If the model returned integers (ms), convert to seconds. 
        // 1000ms = 1s. If value is > 600, likely MS (unless video is > 10 mins and start is late).
        // Safest bet for 'Flash' model outputting schema is that huge numbers are MS.
        if (typeof startVal === 'number' && startVal > 500) {
            startVal = startVal / 1000;
        }
         if (typeof endVal === 'number' && endVal > 500) {
            endVal = endVal / 1000;
        }

        return {
            id: `caption-${index}-${Date.now()}`,
            start: String(startVal || "00:00:00"),
            end: String(endVal || "00:00:01"),
            text: String(item[textKey] || ""),
        };
    });

    return normalizedCaptions;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};