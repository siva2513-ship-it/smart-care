
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
    
    const systemInstruction = `YOU ARE A WORLD-CLASS CLINICAL PHARMACIST AND MEDICAL VISION EXPERT.
    
    MISSION: Precise transcription of doctor handwriting with cultural and linguistic translation.
    
    REASONING STEPS:
    1. VISION: Analyze the base64 image. Detect cursive medicine names, dosages (mg/ml), and Latin abbreviations.
    2. CONTEXT: Patient is ${patientInfo.age} years old with ${patientInfo.condition}. Validate medication dosages against this context.
    3. LANGUAGE ADAPTATION: Output for a native ${langName} speaker.
       - MEDICINE NAME: Keep in English (e.g., "Paracetamol").
       - DOSAGE: Keep in English/Metric (e.g., "650mg").
       - INSTRUCTIONS: Translate into simple, conversational ${langName}.
       - SUMMARY: Provide a warm daily plan in ${langName}.
    
    SCHEMA RULES:
    - timing: MUST ONLY include ["Morning", "Afternoon", "Evening", "Night"].
    - color: MUST ONLY include ["blue", "red", "green", "amber", "yellow"].`;

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
              { text: `Transcribe and translate this prescription for a ${langName} speaker. Return JSON.` }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 4000 },
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
                    timing: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
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

      const text = response.text || '{"medicines": [], "summary": "Error"}';
      const result = JSON.parse(text);
      
      return {
        ...result,
        medicines: (result.medicines || []).map((m: any, idx: number) => ({
          ...m,
          id: `med-${idx}-${Date.now()}`
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
    
    // Using the official Chat session API for better state management
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a medical assistant for an elderly patient. 
        Current Meds: ${medicines.map(m => m.name).join(', ')}.
        Patient: ${patientInfo.age}yrs old.
        Language: Respond EXCLUSIVELY in ${langName.toUpperCase()}.
        Rules: Be empathetic, use simple terms, and always prioritize safety.`
      }
    });

    const response = await chat.sendMessage({ message: query });

    return {
      text: response.text || "...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }
}

export const geminiService = new GeminiService();
