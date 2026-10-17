export type ChatMessage = { role: 'user' | 'model'; text: string };

export type AppMedicationSnapshot = {
  date: string;
  name: string;
  dosage: string;
  time: string;
  status: 'taken' | 'upcoming';
};

export type ChatHealthContext = {
  profile: {
    weightKg: number;
    heightCm: number;
    allergies: string[];
    healthConditions: { name: string; notes: string | null }[];
  } | null;
  schedules: {
    medication: string;
    dosageForm: string;
    doseAmount: number;
    frequency: string;
    times: string[];
    daysOfWeek: string[];
    startDate: string;
    endDate: string | null;
    timezone: string;
  }[];
};

export type ChatReply = { reply: string; emergency: boolean };
