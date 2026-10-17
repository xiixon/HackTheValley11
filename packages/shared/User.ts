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

// User data
export type UserProfile = {
    weightKg: number;
    heightKg: number;
    conditions: HealthCondition[];
    allergies: string[];
}

// Health Condition
export type HealthCondition = {
    id: string;
    name: string;
    notes?: string; // restrictions e.g. medicines to avoid, activities to skip
}