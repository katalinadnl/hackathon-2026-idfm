import { http } from "@/services/api";

export interface CreateSubscriptionPayload {
  beneficiaryId: number;
  referrerId?: number;
  payerId?: number;
  navigoNumber: string;
  subscriptionType: string;
  transportProductId?: number;
  startDate: string; // ISO
  endDate: string; // ISO
  status?: string;
}

export interface Subscription {
  id: number;
  navigoNumber: string;
  subscriptionType: string;
  transportProductId: number | null;
  startDate: string;
  endDate: string;
  status: string;
}

export const subscriptionsApi = {
  create: (payload: CreateSubscriptionPayload) =>
    http.post<Subscription>("/subscriptions", payload),
};