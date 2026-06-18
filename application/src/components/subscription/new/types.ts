import type { BeneficiaryStatus } from "@/lib/api/beneficiaries";

export type Target = "self" | "other";

export type Step =
  | "target"
  | "scan"
  | "profile"
  | "address"
  | "status"
  | "reduction-proof"
  | "plan"
  | "review"
  | "payment"
  | "success";

export const STEP_FLOW: Step[] = [
  "target",
  "scan",
  "profile",
  "address",
  "status",
  "reduction-proof",
  "plan",
  "review",
  "payment",
  "success",
];

export const STATUS_OPTIONS: { value: BeneficiaryStatus; label: string }[] = [
  { value: "ACTIVE", label: "Actif" },
  { value: "STUDENT", label: "Étudiant" },
  { value: "SENIOR", label: "Senior" },
  { value: "UNEMPLOYED", label: "Sans emploi" },
  { value: "DISABLED", label: "En situation de handicap" },
  { value: "MINOR", label: "Mineur" },
];

export const PLAN_DURATION_MONTHS = 12;

// ─── Données de simulation (scan + France Connect) ─────────────────────────

export const FALLBACK_SCAN_NAME = { firstName: "Camille", lastName: "Lefèvre" };
export const MOCK_SCAN_BIRTHDATE = "14/03/1995";
export const SIMULATED_BIRTHDATE_FC = "22/11/1989";
export const SIMULATED_RESIDENCE_CODE = "75";
export const SIMULATED_WORK_CODE = "92";
