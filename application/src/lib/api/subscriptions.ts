import { http } from "@/services/api";
import { BankInfo } from "@/types/bankInfo";
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
export function cancelSubscription(subscriptionId: number) {
  return http.post(`/subscriptions/${subscriptionId}/cancel`);
}
export function getAvailableBankInfos(
  subscriptionId: number,
): Promise<BankInfo[]> {
  return http.get(`/subscriptions/${subscriptionId}/available-bank-infos`);
}

export function changeBankInfo(subscriptionId: number, bankInfoId: number) {
  return http.post(`/subscriptions/${subscriptionId}/change-bank-info`, {
    bankInfoId,
  });
}
