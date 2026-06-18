import { http } from "@/services/api";
import type { BeneficiaryStatus } from "@/types/beneficiary";

export interface CreateBeneficiaryPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthDate: string; // ISO
  socialSecurityNumber?: string;
  status: BeneficiaryStatus;
  residenceDepartmentId: number;
  workStudyDepartmentId?: number;
  linkToMe?: boolean;
}

export interface Beneficiary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string;
  socialSecurityNumber: string | null;
  status: BeneficiaryStatus;
  residenceDepartmentId: number;
  workStudyDepartmentId: number | null;
}

export const beneficiariesApi = {
  create: (payload: CreateBeneficiaryPayload) =>
    http.post<Beneficiary>("/beneficiaries", payload),
};