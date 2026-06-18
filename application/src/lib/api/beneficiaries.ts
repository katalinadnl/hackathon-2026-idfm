import { http } from "@/services/api";

export interface CreateBeneficiaryPayload {
  firstName: string;
  lastName: string;
  birthDate: string; // ISO
  socialSecurityNumber?: string;
  status: BeneficiaryStatus;
  residenceDepartmentId: number;
  workStudyDepartmentId?: number;
  linkToMe?: boolean;
}
export type BeneficiaryStatus =
  | "ACTIVE"
  | "STUDENT"
  | "SENIOR"
  | "UNEMPLOYED"
  | "DISABLED"
  | "MINOR";

export type Beneficiary = {
  firstName: string;
  lastName: string;
  birthDate: string;
  socialSecurityNumber: string | null;
  status: BeneficiaryStatus;
  residenceDepartmentId: number;
  workStudyDepartmentId: number | null;
  id: number;
  accountTitulaireId: number | null;
  accountReferantId: number | null;
};

export const beneficiariesApi = {
  create: (payload: CreateBeneficiaryPayload) =>
    http.post<Beneficiary>("/beneficiaries", payload),

  findAll: () => http.get<Beneficiary[]>("/beneficiaries"),
};
