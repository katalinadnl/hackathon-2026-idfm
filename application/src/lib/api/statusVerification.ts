import { http } from "@/services/api";
import type { BeneficiaryStatus } from "@/types/beneficiary";

export type VerificationSource = "MANUAL_DOCUMENT" | "STATE_API" | "DECLARATIVE";

export interface CreateStatusVerificationPayload {
  beneficiaryId: number;
  status: BeneficiaryStatus;
  source: VerificationSource;
  tariffReductionId?: number;
  documentUrl?: string;
  verified?: boolean;
}

export interface StatusVerification {
  id: number;
  beneficiaryId: number;
  status: BeneficiaryStatus;
  source: VerificationSource;
  verified: boolean;
  documentUrl: string | null;
  tariffReductionId: number | null;
  createdAt: string;
}

export const statusVerificationsApi = {
  create: (payload: CreateStatusVerificationPayload) =>
    http.post<StatusVerification>("/status-verifications", payload),
};