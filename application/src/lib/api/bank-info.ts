import { http } from "@/services/api";
import { BankInfo } from "@/types/bankInfo";

export function getBankInfosForAccount(accountId: number): Promise<BankInfo[]> {
  return http.get(`/bank-infos`);
}

export function getBankInfo(id: number): Promise<BankInfo> {
  return http.get(`/bank-infos/${id}`);
}

export type CreateBankInfoPayload = {
  accountId: number;
  iban: string;
  bic?: string;
  holderName: string;
  label?: string;
  isDefault?: boolean;
};

export function createBankInfo(
  payload: CreateBankInfoPayload,
): Promise<BankInfo> {
  return http.post(`/bank-infos`, payload);
}

export type UpdateBankInfoPayload = Partial<
  Omit<CreateBankInfoPayload, "accountId">
>;

export function updateBankInfo(
  id: number,
  payload: UpdateBankInfoPayload,
): Promise<BankInfo> {
  return http.patch(`/bank-infos/${id}`, payload);
}

export function getBankInfoUsage(
  id: number,
): Promise<{ id: number; reference: string; subscriptionType: string }[]> {
  return http.get(`/bank-infos/${id}/usage`);
}

export function deleteBankInfo(
  id: number,
  replacementBankInfoId?: number,
): Promise<void> {
  return http.delete(`/bank-infos/${id}`, { replacementBankInfoId });
}
