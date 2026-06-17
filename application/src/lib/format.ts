import { BillingRole } from "@/lib/api/billing";

export function formatEuro(amount: number): string {
  const sign = amount < 0 ? "−" : "+";
  const abs = Math.abs(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${abs} €`;
}

export function formatEuroPlain(amount: number): string {
  return `${Math.abs(amount).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const ROLE_LABELS: Record<BillingRole, string> = {
  holder: "Détenteur",
  referrer: "Référent",
  payer: "Payeur",
};

export const METHOD_LABELS: Record<string, string> = {
  card: "Carte bancaire",
  direct_debit: "Prélèvement",
  sepa_debit: "Prélèvement SEPA",
};
