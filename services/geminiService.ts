
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

export class GeminiService {
  /**
   * Helper to handle API errors, specifically the "Requested entity was not found" 
   * which indicates an issue with the API key session.
   */
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
    // ALWAYS instantiate fresh to ensure we use the latest API key from the environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    const systemInstruction = `YOU ARE A WORLD-CLASS CLINICAL PHARMACIST AND OCR HANDWRITING ANALYST.

PRIMARY MISSION: Convert handwritten prescriptions into structured digital data with 100% safety.

OCR REASONING PROTOCOL:
1. CLINICAL DISAMBIGUATION: If a handwritten letter is ambiguous (e.g., 'm' vs 'n'), cross-reference it with your medical knowledge of common drugs. If it looks like 'Anoxicillin', correct it to 'Amoxicillin'.
2. LATIN ABBREVIATION EXPANSION:
   - OD/QD -> Once Daily
   - BD/BID -> Twice Daily
   - TID/TDS -> Thrice Daily
   - QID -> Four times Daily
   - AC -> Before Food
   - PC -> After Food
   - HS -> At Bedtime
3. DOSAGE VALIDATION: Check if the dosage (e.g., 500mg) is typical for the medicine identified.
4. LINGUISTIC ADAPTATION: Translate instructions for the patient into warm, simple, and clear ${langName}. Use analogies if helpful.

PATIENT PROFILE:
- Age: ${patientInfo.age}
- Known Conditions: ${patientInfo.condition}

OUTPUT SCHEMA:
- medicines: Array of objects.
- timing: MUST be one or more of ["Morning", "Afternoon", "Evening", "Night"].
- color: Describe the pill color for visual confirmation (e.g., "white", "blue/white capsule").
- instructions: Simple, actionable steps for the user in ${langName}.
- summary: A comforting 2-sentence health summary in ${langName}.`;

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
            { text: `Extract all medical data from this prescription. Identify names, dosages, and timings. Provide instructions in ${langName}.` }
          ]
        },
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 12000 }, // High budget for handwriting analysis
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
          systemInstruction: `You are a helpful and extremely safe Medical AI Assistant for an elderly patient.

PATIENT PROFILE:
- Age: ${patientInfo.age}
- Condition: ${patientInfo.condition}
- Language: ${langName}

ACTIVE MEDICATIONS:
${medicines.map(m => `- ${m.name} (${m.dosage}): ${m.instructions}`).join('\n')}

GUIDELINES:
1. ALWAYS use Google Search to verify contraindications or specific side effects of the drugs listed.
2. If the user reports severe pain, breathing issues, or chest pain, tell them to call emergency services IMMEDIATELY.
3. Never recommend changing a dose. Tell them to consult their doctor.
4. Respond strictly in ${langName}. Be warm and brief.`
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
