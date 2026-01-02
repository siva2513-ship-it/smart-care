import { GoogleGenAI, Type } from "@google/genai";
import { PrescriptionAnalysis, Medicine, PatientInfo } from "../types";

export class GeminiService {
  private getClient(): GoogleGenAI {
    // Re-instantiate to pick up the selected API Key from the session dialog.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzePrescription(base64Image: string, patientInfo?: PatientInfo): Promise<PrescriptionAnalysis> {
    const ai = this.getClient();
    const personaPrompt = this.getPersonaInstruction(patientInfo);
    
    // Detailed system instruction for the AI pharmacist persona
    const systemInstruction = `YOU ARE A WORLD-CLASS CLINICAL PHARMACIST AND MEDICAL OCR EXPERT.
    
    GOAL: Extract medicine details from an image for an elderly patient.
    
    PRECISION RULES:
    1. DECODE LATIN SHORTHAND: 
       - OD/QD/Once Daily -> Morning
       - BID/BD/Twice Daily -> Morning, Night
       - TID/TDS/Three times -> Morning, Afternoon, Night
       - QID -> Morning, Afternoon, Evening, Night
       - HS/Hora Somni -> Night
       - AC (Ante Cibum) -> Before Food
       - PC (Post Cibum) -> After Food
    
    2. MEDICINE NAMES: Identify the full name + strength (e.g. "Amlodipine 5mg").
    
    3. INSTRUCTIONS: Convert "1 tab PO TID PC" into "Take 1 tablet by mouth three times a day, after you eat."
    
    4. CONFIDENCE: If the text is illegible, DO NOT GUESS. Set the name to "Unclear Medicine" and add a warning to the summary.
    
    5. COLOR SCHEME: 
       - Chronic/Heart: blue
       - Pain/SOS: red
       - Vitamins: green
       - Evening/Sleep: amber
       - Morning/Energy: yellow

    ${personaPrompt}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High accuracy multimodal model for complex OCR
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image.split(',')[1] || base64Image
                }
              }
            ]
          }
        ],
        config: {
          systemInstruction: systemInstruction,
          thinkingConfig: { thinkingBudget: 4000 }, // Added thinking budget for complex extraction
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
                    color: { type: Type.STRING, enum: ["blue", "red", "green", "amber", "yellow"] }
                  },
                  required: ["name", "dosage", "timing", "instructions", "color"]
                }
              },
              summary: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text || '{"medicines": [], "summary": "I could not read the document. Please try a clearer photo."}';
      const result = JSON.parse(text);
      
      return {
        ...result,
        medicines: (result.medicines || []).map((m: any, idx: number) => ({
          ...m,
          id: `med-${idx}-${Date.now()}`
        }))
      };
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      throw error;
    }
  }

  async askQuestion(query: string, medicines: Medicine[], patientInfo?: PatientInfo): Promise<string> {
    const ai = this.getClient();
    // System instruction defining the chatbot's supportive persona and context
    const systemInstruction = `Assistant for patient with ${patientInfo?.condition}. Age: ${patientInfo?.age}. 
    Known medicines: ${JSON.stringify(medicines)}. 
    Reply warmly, simply, and briefly (2 sentences max). Always advise consulting a professional for health changes.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Flash is sufficient for simple Q&A
        contents: [{ parts: [{ text: query }] }],
        config: {
          systemInstruction: systemInstruction
        }
      });
      return response.text || "I'm here to help. What else can I check for you?";
    } catch (error) {
      return "I'm having trouble connecting. Please check your schedule below.";
    }
  }

  private getPersonaInstruction(info?: PatientInfo): string {
    if (info?.condition.toLowerCase().includes('alzheimer')) {
      return "PATIENT HAS MEMORY LOSS. Use repetitive language. Be extremely patient. Keep instructions singular and sequential.";
    }
    return "Patient is elderly. Use clear, large font concepts and warm tones.";
  }
}

export const geminiService = new GeminiService();