
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzePrescription(base64Image: string, patientInfo?: PatientInfo): Promise<PrescriptionAnalysis> {
    const ai = this.getClient();
    
    const systemInstruction = `YOU ARE A CLINICAL PHARMACIST & OCR SPECIALIST.
    
    1. OCR ACCURACY: The image might be blurry or handwritten. Use your medical knowledge to correct spelling. (e.g., "Amoxcil" -> "Amoxicillin").
    2. CLINICAL REASONING: Verify that the dosage makes sense for the drug (e.g., 500mg is typical for Amoxicillin, but not for Lisinopril).
    3. SAFETY PROFILE: For every medicine, extract:
       - Common side effects (relevant to seniors).
       - Interactions (especially with other meds in the list).
       - Drug Class (e.g., NSAID, Statin, Beta-blocker).
    4. LATIN DECODING: PO=by mouth, QHS=bedtime, BID=twice daily, TID=thrice daily.
    
    PATIENT CONTEXT: ${patientInfo?.condition}, Age: ${patientInfo?.age}.`;

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
              { text: "Read this prescription. Return JSON for medicines, side effects, and a simple 2-sentence voice-friendly summary for a senior." }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 12000 },
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
                      items: { type: Type.STRING, enum: ["Morning", "Afternoon", "Evening", "Night"] }
                    },
                    instructions: { type: Type.STRING },
                    color: { type: Type.STRING, enum: ["blue", "red", "green", "amber", "yellow"] },
                    drugClass: { type: Type.STRING },
                    sideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    interactions: { type: Type.STRING }
                  },
                  required: ["name", "dosage", "timing", "instructions", "color"]
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "No data found."}';
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

  async getGlobalHealthAlerts(): Promise<{ text: string; sources: any[] }> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What are the most critical medical news, FDA drug recalls, or public health alerts from the last 7 days? Summarize in 3 bullet points for a public safety dashboard.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    return {
      text: response.text || "Scanning for health alerts...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }

  async getNearbySupport(lat: number, lng: number): Promise<{ text: string; sources: any[] }> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find 3 pharmacies nearby. List their names and a one-sentence summary of why they are a good choice (e.g. 24 hours, highly rated).",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      }
    });

    return {
      text: response.text || "Locating local pharmacies...",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }

  async askQuestion(query: string, medicines: Medicine[], patientInfo?: PatientInfo): Promise<{ text: string; sources?: any[] }> {
    const ai = this.getClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User Query: ${query}\nPatient Context: ${patientInfo?.condition}\nActive Meds: ${JSON.stringify(medicines)}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are a medical companion for seniors. 
        1. Explain side effects and interactions using simple language. 
        2. ALWAYS use Google Search to check the latest clinical findings for the drug class.
        3. MANDATORY: End every single message with a clarifying question about the patient's symptoms (e.g., "Are you feeling more sleepy than usual?").
        4. Include a disclaimer that you are an AI.`
      }
    });

    return {
      text: response.text || "I'm sorry, I'm having trouble connecting to medical databases. Please check with your pharmacist.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }
}

export const geminiService = new GeminiService();
