
import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzePrescription(base64Image: string, patientInfo?: PatientInfo): Promise<PrescriptionAnalysis> {
    const ai = this.getClient();
    
    const systemInstruction = `YOU ARE A SENIOR CLINICAL PHARMACIST & VISION EXPERT.
    
    HANDWRITING DECODING PROTOCOL:
    1. VISUAL EVIDENCE: Carefully trace strokes in handwritten text. Use medical context to resolve ambiguities (e.g., "1" vs "l", "0" vs "o").
    2. CLINICAL VALIDATION: Compare recognized drug names against the patient's condition: ${patientInfo?.condition}. If the handwriting says "Amox...n" and the patient is ${patientInfo?.age} years old, it is likely Amoxicillin.
    3. DOSAGE SANITY CHECK: Verify if the recognized dosage (e.g., 500mg) is standard for that drug. If it seems lethal or impossible, flag it.
    4. INTERACTION CHECK: Look for contraindications between ALL drugs listed in the scan.
    
    LATIN ABBREVIATIONS:
    - PO: by mouth
    - BID: twice a day
    - TID: three times a day
    - QID: four times a day
    - QHS: at bedtime
    - PRN: as needed
    
    OUTPUT: Provide a simple, clear summary for a senior patient. Avoid medical jargon.`;

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
              { text: "Read this prescription with 100% accuracy. Use your highest reasoning capability to decode handwriting. If any word is totally unreadable, mark it as [UNREADABLE]. Return JSON." }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 32768 }, // MAX BUDGET for highest accuracy
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
                    interactions: { type: Type.STRING },
                    confidenceNote: { type: Type.STRING, description: "Add a note if the handwriting was difficult to read for this specific entry." }
                  },
                  required: ["name", "dosage", "timing", "instructions", "color"]
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "I could not find any medicines. Please try a clearer photo."}';
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
      contents: "List the most critical medical news, FDA drug recalls, or public health alerts from the last 7 days. Focus on things relevant to medication safety.",
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
      contents: "Locate the 3 nearest pharmacies. Mention their name and if they offer prescription pickup services.",
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
        systemInstruction: `You are a helpful pharmacist assistant. 
        1. Always verify safety information using Google Search.
        2. Keep language simple for seniors.
        3. MANDATORY: End every response with a symptom-check question.
        4. If the user mentions pain, ask where it hurts.`
      }
    });

    return {
      text: response.text || "I'm sorry, I'm having trouble connecting to medical databases. Please check with your pharmacist.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  }
}

export const geminiService = new GeminiService();
