import { http } from "@/services/api";

export interface Tariff {
  id: number;
  name: string;
  description: string | null;
  indication: string | null;
  period: string | null;
  priceLabel: string;
  priceCents: number | null;
  sellingArguments: string[];
  subscriptionTag: string | null;
  portalUrl: string | null;
  rechargeUrl: string | null;
  imageUrl: string | null;
  isAnnualPlan: boolean;
  reductions: TariffReduction[];
}

export interface TariffReduction {
  id: number;
  name: string;
  description: string | null;
  indication: string | null;
  reductionPercent: number | null;
  isFree: boolean;
  sellingArguments: string[];
}

export const tariffsApi = {
  list: () => http.get<Tariff[]>("/tariffs"),
};
