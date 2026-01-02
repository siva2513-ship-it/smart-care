
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

export class GeminiService {
  /**
   * Helper to handle API errors, specifically the "Requested entity was not found" 
   * which indicates an issue with the API key session.
   */
  // Added : Promise<never> to ensure the compiler knows this function throws and satisfies return type checks
  private async handleApiError(error: any): Promise<never> {
    console.error("Gemini API Error:", error);
    const errorMessage = error?.message || String(error);
    
    // Check for the specific error that requires re-selection of API key
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
    // Always create a fresh instance per call to ensure latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const langName = this.getLanguageName(patientInfo.language);
    
    const systemInstruction = `YOU ARE A CLINICAL PHARMACY SPECIALIST AND OCR EXPERT.
    
    TASK: Extract all medical data from the provided image.
    
    ACCURACY PROTOCOL:
    1. CULTURAL CONTEXT: Use patient data (Age: ${patientInfo.age}, Condition: ${patientInfo.condition}) to disambiguate handwriting.
    2. ABBREVIATION EXPANSION:
       - OD -> Once Daily
       - BD/BID -> Twice Daily
       - TID -> Thrice Daily
       - AC -> Before Food
       - PC -> After Food
    3. CLINICAL CROSS-REFERENCE: If a word is 70% similar to a known drug name (e.g., Metformin, Amlodipine, Paracetamol), assume the standard medical spelling.
    4. LANGUAGE: Translate all patient instructions into simple, conversational ${langName}.

    OUTPUT SCHEMA:
    - medicines: List of detected drugs.
    - timing: MUST be one or more of ["Morning", "Afternoon", "Evening", "Night"].
    - color: Best visual color description for pill identification.
    - drugClass: Type of drug (e.g., Antibiotic, Painkiller).`;

    try {
      // Corrected contents structure to match SDK examples: { parts: [...] }
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
            { text: `Extract all medicines from this prescription. Return JSON for a ${langName} speaker.` }
          ]
        },
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 8000 },
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

      const text = response.text || '{"medicines": [], "summary": "Error reading image"}';
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
          systemInstruction: `You are a medical assistant for an elderly patient (${patientInfo.age} years old).
          
          CURRENT MEDICATION LIST:
          ${medicines.map(m => `- ${m.name} (${m.dosage}): ${m.instructions}`).join('\n')}
          
          GUIDELINES:
          1. Use Google Search to verify contraindications and side effects.
          2. Respond strictly in ${langName}.
          3. If the user reports a serious symptom (chest pain, shortness of breath), advise them to call emergency services immediately.
          4. Keep answers brief and easy to understand for seniors.`
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
