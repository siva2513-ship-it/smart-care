
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

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
    
    const systemInstruction = `ACT AS A SENIOR CLINICAL PHARMACIST AND OCR EXPERT.
    GOAL: Literal and Intelligent Extraction from Prescription Images.

    EXTRACTION PROTOCOL:
    1. LITERAL OCR: Extract exact drug names and strengths (e.g., "Metformin 500mg").
    2. TIMING RESOLUTION: Map doctors' shorthand (OD, BD, TDS, HS) to specific TimeOfDay categories (Morning, Afternoon, Evening, Night).
    3. MEAL RELATIONSHIP: Specifically look for "AC" (Before Food) or "PC" (After Food) or handwritten notes like "khali pet".
    4. TIME SUGGESTION: Suggest a logical hour (e.g., 08:00 AM) for each dose if not explicitly stated.
    5. SAFETY: Check if the dosage is standard for a ${patientInfo.age}yo patient with ${patientInfo.condition}.

    OUTPUT SCHEMA:
    - doctorName: string
    - date: string
    - medicines: [{
        name, 
        dosage, 
        timing[] (Morning/Afternoon/Evening/Night), 
        specificTime (HH:MM AM/PM),
        mealInstruction (Before Food/After Food/With Food/Empty Stomach/None),
        instructions (${langName}), 
        color, 
        drugClass
      }]
    - summary: 2-3 sentences in ${langName} summarizing the regimen.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image
              }
            },
            { text: `Analyze this medical prescription for a ${patientInfo.age}yo. Output instructions in ${langName}.` }
          ]
        },
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              doctorName: { type: Type.STRING },
              date: { type: Type.STRING },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    timing: { type: Type.ARRAY, items: { type: Type.STRING } },
                    specificTime: { type: Type.STRING },
                    mealInstruction: { 
                      type: Type.STRING, 
                      enum: ['Before Food', 'After Food', 'With Food', 'Empty Stomach', 'None'] 
                    },
                    instructions: { type: Type.STRING },
                    color: { type: Type.STRING },
                    drugClass: { type: Type.STRING },
                  },
                  required: ["name", "dosage", "timing", "instructions", "mealInstruction"]
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "OCR Failed"}';
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
          Current medications: ${medicines.map(m => `${m.name} (${m.mealInstruction})`).join(', ')}.
          Patient Language: ${langName}.`
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
