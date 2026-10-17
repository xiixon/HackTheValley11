type Priority = "low" | "medium" | "high";
type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'cancelled';

type Recurrence = {
    frequency: RecurrenceFrequency;
    interval? : number;
    endDate?: Date;
}

export type Reminder = {
    id: string;
    title: string;
    description?: string;

    priority: Priority;
    createdAt: Date;
    
    status: ReminderStatus;
    recurrence?: Recurrence;
}