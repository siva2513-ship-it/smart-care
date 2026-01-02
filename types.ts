
export enum TimeOfDay {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  EVENING = 'Evening',
  NIGHT = 'Night'
}

export type Language = 'en' | 'hi' | 'te';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  timing: TimeOfDay[];
  instructions: string;
  icon: string;
  color: string;
  drugClass?: string;
  sideEffects?: string[];
  interactions?: string;
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
}

export type ReminderPreference = 'voice' | 'notification' | 'both';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

export interface CaregiverAlert {
  id: string;
  medicineName: string;
  status: 'missed' | 'taken';
  time: string;
  timestamp: Date;
}
