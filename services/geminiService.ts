
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

export class GeminiService {
  /**
   * Enhanced error handler that detects API Key session loss.
   */
  private async handleApiError(error: any): Promise<never> {
    console.error("Gemini API Error Context:", error);
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("API_KEY_INVALID")) {
      console.warn("API Key session lost or invalid. Triggering recovery.");
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
    // USING FLASH FOR ULTRA-FAST OCR & EXTRACTION
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    const systemInstruction = `YOU ARE A HIGH-SPEED CLINICAL DATA EXTRACTOR. 
    TARGET PATIENT: ${patientInfo.age}yo with ${patientInfo.condition}.
    
    CORE PROTOCOL (SPEED & ACCURACY):
    1. EXTRACT: Directly pull all medicine names, dosages, and timings from the image.
    2. RESOLVE: If handwriting is messy, use pharmaceutical context to correct it (e.g. "Parcetmol" -> "Paracetamol").
    3. LOCALIZE: Translate ALL instructions and clinical summaries into ${langName} immediately.
    4. SAFETY: If a dosage is visibly excessive for a ${patientInfo.age}yo, flag it in the summary.
    5. IDENTIFY: Briefly describe medicine color/shape based on common forms of the drug.

    STRICT JSON OUTPUT IN ${langName}:
    - medicines: [{name, dosage, timing[], instructions, color, drugClass}]
    - summary: 2-3 sentence reassuring overview.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Flash is significantly faster for Vision-to-JSON
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image
              }
            },
            { text: `Extract all prescription details. Language: ${langName}.` }
          ]
        },
        config: {
          systemInstruction,
          // Thinking budget set to 0 for maximum speed; Flash is naturally fast at OCR
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    timing: { type: Type.ARRAY, items: { type: Type.STRING } },
                    instructions: { type: Type.STRING },
                    color: { type: Type.STRING },
                    drugClass: { type: Type.STRING },
                  },
                  required: ["name", "dosage", "timing", "instructions", "color"]
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "Scanning failed."}';
      const result = JSON.parse(text);
      
      return {
        ...result,
        medicines: (result.medicines || []).map((m: any, idx: number) => ({
          ...m,
          id: `med-${idx}-${Date.now()}`,
          icon: 'pill'
        }))
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
          systemInstruction: `You are the SmartCare Senior Medical Assistant. 
          Context: Patient is ${patientInfo.age}yo, Condition: ${patientInfo.condition}.
          Medications: ${medicines.map(m => m.name).join(', ')}.
          
          GUIDELINES:
          1. Use Google Search for interactions.
          2. Respond strictly in ${langName}.
          3. Emergency: Advise calling 911/emergency services if symptoms are severe.`
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
