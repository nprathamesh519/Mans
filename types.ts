
export enum UserRole {
  PATIENT = 'patient',
  CARETAKER = 'caretaker',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  patientId?: string; // For caretakers, linking to their patient
  patientCode?: string; // For patients, to be shared with caretakers
}

export interface FaceProfile {
  id: string;
  name:string;
  relation: string;
  imageUrl: string;
  notes: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  tags: string[];
}

export enum ReminderType {
  MEDICATION = 'medication',
  APPOINTMENT = 'appointment',
  ACTIVITY = 'activity',
  OTHER = 'other',
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  type: ReminderType;
  isCompleted: boolean;
}

export interface Alert {
  id: string;
  type: 'SOS' | 'SafeZoneExit';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface SafeZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number; // in meters
}