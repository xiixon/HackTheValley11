// Creating types used for user data

// Account info
export type User = {
    id: string;
    firstName: string;
    lastName: string;
    contact: Contact;
    createdAt: string;
    profile?: UserProfile;
}

// Contact info
export type Contact =
  | { email: string; phone?: string }
  | { phone: string; email?: string };

export type Sex = "male" | "female" | "other";

// User data
export type UserProfile = {
    weightKg: number;
    heightCm: number;
    sex: Sex;
    birthDate: string; // "YYYY-MM-DD"
    conditions: HealthCondition[];
    allergies: string[];
}

// Health Condition
export type HealthCondition = {
    id: string;
    name: string;
    notes?: string; // restrictions e.g. medicines to avoid, activities to skip
}