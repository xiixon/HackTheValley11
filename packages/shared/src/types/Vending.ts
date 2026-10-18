export type VendingDose = {
  id: string; date: string; time: string; name: string; dosage: string;
  status: 'upcoming' | 'taken';
};
export type VendingItem = { id: string; name: string; description: string; doses: number; productId?: string; priceCents?: number };
export type VendingPlan = {
  kind: 'schedule' | 'purchase'; items: VendingItem[]; totalDoses: number;
  totalCents: number; referrals: VendingItem[]; startDate?: string; endDate?: string; days?: number;
};
export type VendingProduct = { id: string; name: string; detail: string; category: string; priceCents: number; color: string };
export type VendingOrder = {
  id: string; status: 'review' | 'queued' | 'dispensing' | 'completed' | 'failed';
  plan: VendingPlan; progress: number; deviceMode: string | null; error: string | null;
};
export type VendingPass = { code: string; qrValue: string; syncedAt: string; doseCount: number };

export type VendingEligibility = { eligible: boolean; productId?: string; message: string };
export type PharmacistReferral = { name: string; area: string; message: string; mock: true };
