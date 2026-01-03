
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

export class GeminiService {
  private async handleApiError(error: any): Promise<never> {
    console.error("Gemini API Error:", error);
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("Requested entity was not found") && typeof window !== 'undefined') {
      const win = window as any;
      if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
        console.warn("API Key session lost. Re-prompting user.");
        await win.aistudio.openSelectKey();
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
    
    const systemInstruction = `YOU ARE AN ELITE CLINICAL PHARMACY OCR SYSTEM.
    
    CRITICAL PROTOCOL:
    1. CLINICAL DISAMBIGUATION: Doctors often write 'm' like 'n' or 'a' like 'o'. Cross-reference all extracted text with a pharmaceutical database. If you see "Anoxicillun", correct it to "Amoxicillin".
    2. DOSE SANITY CHECK: Flag if a dose seems unusually high for a ${patientInfo.age} year old.
    3. ABBREVIATION EXPANSION: Convert all Latin sigs (OD, BID, TID, AC, PC) into plain ${langName} instructions.
    4. ACCESSIBILITY: Use warm, encouraging language. Avoid medical jargon where possible.

    OUTPUT SCHEMA:
    - medicines: List of detected medications.
    - timing: MUST be subset of ["Morning", "Afternoon", "Evening", "Night"].
    - color: Describe the pill color for the user to find it easily.
    - instructions: Numbered steps in ${langName}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image
              }
            },
            { text: `Scan this prescription for a ${patientInfo.age}yo patient. Provide clear ${langName} instructions.` }
          ]
        },
        config: {
          systemInstruction,
          thinkingConfig: { thinkingBudget: 15000 },
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

      const text = response.text || '{"medicines": [], "summary": "Scanning error"}';
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
          systemInstruction: `You are a warm Medical Safety Assistant. 
          Current Meds: ${medicines.map(m => m.name).join(', ')}.
          Patient: ${patientInfo.age}yo with ${patientInfo.condition}.
          
          RULES:
          1. Use Google Search to verify drug interactions.
          2. ALWAYS warn that you are an AI and they must consult a doctor for emergencies.
          3. Respond strictly in ${langName}.
          4. If symptoms sound serious, advise immediate ER/Doctor visit.`
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
