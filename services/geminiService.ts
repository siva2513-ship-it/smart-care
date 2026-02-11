
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language, TimeOfDay } from "../types";

export class GeminiService {
  private async handleApiError(error: any): Promise<never> {
    console.error("Gemini API Error Context:", error);
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY_INVALID")) {
      if (typeof window !== 'undefined') {
        const win = window as any;
        if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
          await win.aistudio.openSelectKey();
        }
      }
    }
    throw error;
  }

  private getLanguageName(lang: Language): string {
    switch (lang) {
      case 'hi': return 'Hindi';
      case 'te': return 'Telugu';
      default: return 'English';
    }
  }

  async analyzePrescription(base64Image: string, patientInfo: PatientInfo): Promise<PrescriptionAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    const systemInstruction = `ACT AS A SENIOR PHARMACIST.
Extract medication schedule from prescription image.
Output Language: ${langName}.

TIMING MAPPING (STRICT):
- 1-0-1, BID, Twice, M-N -> ["Morning", "Night"]
- 1-1-1, TDS, Thrice, M-A-N -> ["Morning", "Afternoon", "Night"]
- 1-0-0, OD, Once, M -> ["Morning"]
- 0-0-1, HS, Bedtime, N -> ["Night"]
- 1-1-1-1, QID -> ["Morning", "Afternoon", "Evening", "Night"]
- 0-1-0 -> ["Afternoon"]
- 1-1-0 -> ["Morning", "Afternoon"]
- 0-1-1 -> ["Afternoon", "Night"]

JSON SCHEMA:
- doctorName: string
- medicines: Array of {
    name: string,
    dosage: string,
    timing: Array<"Morning" | "Afternoon" | "Evening" | "Night">,
    mealInstruction: "Before Food" | "After Food" | "None",
    instructions: string (short, translated),
    confidenceScore: number,
    verificationStatus: "verified" | "unverified"
  }
- summary: 2 sentences in ${langName}.

Return ONLY raw JSON.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image
              }
            },
            { text: "Extract medication schedule. Return strictly JSON." }
          ]
        },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "Failed"}';
      const result = JSON.parse(text);
      
      const validTimings = ['Morning', 'Afternoon', 'Evening', 'Night'];

      return {
        ...result,
        medicines: (result.medicines || []).map((m: any, idx: number) => {
          const normalizedTiming = (m.timing || [])
            .map((t: string) => validTimings.find(v => v.toLowerCase() === t.toLowerCase()))
            .filter(Boolean) as TimeOfDay[];

          return {
            ...m,
            id: `med-${idx}-${Date.now()}`,
            icon: 'pill',
            color: 'blue',
            timing: normalizedTiming.length > 0 ? normalizedTiming : [TimeOfDay.MORNING]
          };
        }),
        scanAccuracy: result.scanAccuracy || 0.95
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  async askQuestion(query: string, medicines: Medicine[], history: ChatMessage[], patientInfo: PatientInfo): Promise<{ text: string; sources?: any[] }> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    try {
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          tools: [{ googleSearch: {} }],
          thinkingConfig: { thinkingBudget: 0 },
          systemInstruction: `CARE ASSISTANT. Help with medications: ${medicines.map(m => m.name).join(', ')}. Language: ${langName}. Keep answers short and senior-friendly.`
        }
      });

      const response = await chat.sendMessage({ message: query });
      return {
        text: response.text || "...",
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      return this.handleApiError(error);
    }
  }
}

export const geminiService = new GeminiService();
