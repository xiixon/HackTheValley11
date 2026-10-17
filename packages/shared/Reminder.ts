import { Schedule } from "./Schedule";

type Priority = "low" | "medium" | "high";

export type Reminder = {
    id: string;
    title: string;
    description?: string;

    priority: Priority;
    createdAt: Date;
    schedule: Schedule;
}