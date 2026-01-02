
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo, ChatMessage, Language } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getLanguageName(lang: Language): string {
    switch (lang) {
      case 'hi': return 'Hindi';
      case 'te': return 'Telugu';
      default: return 'English';
    }
  }

  async analyzePrescription(base64Image: string, patientInfo: PatientInfo): Promise<PrescriptionAnalysis> {
    const ai = this.getClient();
    const langName = this.getLanguageName(patientInfo.language);
    
    // Enhanced system instruction for superior OCR and Clinical Logic
    const systemInstruction = `YOU ARE AN ELITE CLINICAL PHARMACIST SPECIALIZING IN HANDWRITING RECOGNITION (OCR) AND GERIATRIC CARE.

    PRIMARY MISSION: Extract medication data from prescription images with 100% safety accuracy.

    OCR HANDWRITING STRATEGY:
    1. LINGUISTIC MAPPING: Doctors often use Latin abbreviations. Map them:
       - OD/QD -> Once Daily
       - BID/BD -> Twice Daily
       - TID/TD -> Thrice Daily
       - QID -> Four times Daily
       - AC -> Before Food
       - PC -> After Food
       - HS -> At Bedtime
    2. VISUAL DISAMBIGUATION: If a letter is ambiguous (e.g., 'n' vs 'm', '1' vs 'l'), use medical context (e.g., 'Amlodipine' is common, 'Anlodipine' is not).
    3. DOSAGE VALIDATION: Check if extracted dosage (e.g., 500mg) is standard for that drug.

    PATIENT CONTEXT:
    - Age: ${patientInfo.age}
    - Known Conditions: ${patientInfo.condition}
    - Target Language: ${langName}

    OUTPUT SCHEMA REQUIREMENTS:
    - medicines: List of objects.
    - timing: EXACTLY one or more of ["Morning", "Afternoon", "Evening", "Night"].
    - color: A visual pill color for elderly identification (e.g., "white", "blue", "red").
    - instructions: Simple, actionable steps in ${langName}.
    - summary: A warm, empathetic overview of the day's health plan in ${langName}.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image.split(',')[1] || base64Image
                }
              },
              { text: `Perform deep OCR on this prescription. Identify all medicines, dosages, and frequencies. Translate instructions to ${langName}. Respond in JSON.` }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 8000 }, // Increased budget for complex handwriting
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Generic or Brand name in English" },
                    dosage: { type: Type.STRING, description: "Strength, e.g., 500mg or 5ml" },
                    timing: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    instructions: { type: Type.STRING, description: `Simple instructions in ${langName}` },
                    color: { type: Type.STRING, description: "Suggested pill color for UI" },
                    drugClass: { type: Type.STRING },
                  },
                  required: ["name", "dosage", "timing", "instructions", "color"]
                }
              },
              summary: { type: Type.STRING, description: `Warm summary in ${langName}` }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "Error"}';
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
      console.error("Analysis Error:", error);
      throw error;
    }
  }

  async askQuestion(query: string, medicines: Medicine[], history: ChatMessage[], patientInfo: PatientInfo): Promise<{ text: string; sources?: any[] }> {
    const ai = this.getClient();
    const langName = this.getLanguageName(patientInfo.language);
    
    // Injecting full medical context into the chat session
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a helpful and extremely safe Medical AI Assistant.
        PATIENT PROFILE: Age ${patientInfo.age}, Condition: ${patientInfo.condition}.
        ACTIVE MEDICATIONS: ${medicines.map(m => `${m.name} (${m.dosage})`).join(', ')}.
        LANGUAGE: Always respond in ${langName.toUpperCase()}.
        
        CRITICAL SAFETY RULES:
        1. If a user asks about changing dosage, tell them to CONSULT THEIR DOCTOR immediately.
        2. Use the 'googleSearch' tool to verify side effects or interactions for the specific meds listed above.
        3. Be empathetic but professional. Use simple analogies for medical terms.
        4. If the language is Hindi or Telugu, ensure the grammar is natural and respectful for an elderly user.`
      }
    });

    // Format history for the chat API
    // Note: official Chat.sendMessage handles turn management
    const response = await chat.sendMessage({ message: query });

    return {
      text: response.text || "...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }
}

export const geminiService = new GeminiService();
