import { http } from "@/services/api";
import { AccountInfo } from "@/types/subscription";

export type ReportReason = "lost" | "stolen" | "damaged";

export interface NewAddressPayload {
  line1: string;
  line2?: string;
  city: string;
  postalCode: string;
}

export interface ReportLostOrStolenPayload {
  reason: ReportReason;
  addressId?: number;
  newAddress?: NewAddressPayload;
}

export function searchAccountsByEmail(email: string): Promise<AccountInfo[]> {
  return http.get(`/accounts/search?email=${encodeURIComponent(email)}`);
}

export function assignReferrer(subscriptionId: number, accountId: number) {
  return http.post(`/subscriptions/${subscriptionId}/assign-referrer`, {
    referrerId: accountId,
  });
}

export function unlinkReferrer(subscriptionId: number) {
  return http.post(`/subscriptions/${subscriptionId}/unlink-referrer`);
}

export function reportLostOrStolen(
  subscriptionId: number,
  payload: ReportLostOrStolenPayload,
) {
  return http.post(
    `/subscriptions/${subscriptionId}/report-lost-or-stolen`,
    payload,
  );
}
