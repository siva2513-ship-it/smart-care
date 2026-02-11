
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    const systemInstruction = `YOU ARE AN ELITE CLINICAL PHARMACY OCR & DIAGNOSTIC SYSTEM.
    
    OBJECTIVE: Extract and translate handwritten clinical prescriptions for a ${patientInfo.age}yo patient.
    
    OCR PROTOCOL:
    1. CLINICAL DISAMBIGUATION: Correct sloppy handwriting using pharmaceutical context (e.g., 'm' vs 'n' confusion). 
    2. DRUG CLASS VERIFICATION: Identify the class (Antibiotic, NSAID, etc.) and cross-check common dosage levels for the patient's age.
    3. ABBREVIATION EXPANSION: Convert Latin sigs (OD, BID, TID, TDS, AC, PC, QID) into plain ${langName} instructions.
    4. SAFETY ALERT: If a dose seems life-threateningly high for a ${patientInfo.age}yo, flag it in the summary.
    5. VISUAL FINDER: Describe the medicine color/shape based on the name (e.g., 'White round pill') to help the patient identify it.

    OUTPUT SCHEMA:
    - medicines: name, dosage, timing (subset of ["Morning", "Afternoon", "Evening", "Night"]), instructions (${langName}), color, drugClass.
    - summary: A comforting, professional 2-3 sentence overview in ${langName}.`;

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
            { text: `Analyze this prescription for a ${patientInfo.age}yo patient. Translate all patient-facing text to ${langName}.` }
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

      const text = response.text || '{"medicines": [], "summary": "Error: OCR engine failed."}';
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
          systemInstruction: `You are the SmartCare Medical Assistant. 
          Context: Patient is ${patientInfo.age}yo, Condition: ${patientInfo.condition}.
          Current Medications: ${medicines.map(m => m.name).join(', ')}.
          
          GUIDELINES:
          1. Use Google Search for drug interactions/side effects.
          2. Respond strictly in ${langName}.
          3. Emergency: Advise calling emergency services for critical symptoms.`
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
