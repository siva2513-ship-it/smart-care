
export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  NIGHT = 'Night'
}

export type Language = 'en' | 'hi' | 'te';
export type UserRole = 'PATIENT' | 'NURSE' | 'CHILD' | 'GUARDIAN' | 'SPOUSE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  timing: TimeOfDay[];
  specificTime?: string; // e.g. "08:00 AM"
  mealInstruction?: 'Before Food' | 'After Food' | 'With Food' | 'Empty Stomach' | 'None';
  instructions: string;
  icon: string;
  color: string;
  drugClass?: string;
  sideEffects?: string[];
  interactions?: string;
  confidenceScore: number; // 0.0 to 1.0
  verificationStatus: 'verified' | 'unverified' | 'ambiguous';
}

export interface PatientInfo {
  age: string;
  condition: string;
  language: Language;
  caregiverRelationship: string;
}

export interface PrescriptionAnalysis {
  medicines: Medicine[];
  patientName?: string;
  doctorName?: string;
  date?: string;
  summary: string;
  scanAccuracy: number;
}

export type ReminderPreference = 'voice' | 'notification' | 'both';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}
