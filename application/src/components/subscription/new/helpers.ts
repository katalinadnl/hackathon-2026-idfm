import type { BeneficiaryStatus } from "@/lib/api/beneficiaries";
import type { Tariff, TariffReduction } from "@/lib/api/tariffs";
import { STATUS_OPTIONS } from "./types";

export function pickRandomStatus(): BeneficiaryStatus {
  const idx = Math.floor(Math.random() * STATUS_OPTIONS.length);
  return STATUS_OPTIONS[idx].value;
}

export function generateSimulatedSsn(birth: string, deptCode: string): string {
  const parsed = parseFrDate(birth);
  const yy = parsed ? String(parsed.getFullYear()).slice(-2) : "00";
  const mm = parsed ? String(parsed.getMonth() + 1).padStart(2, "0") : "00";
  return `1 ${yy} ${mm} ${deptCode} 123 456 78`;
}

export function formatTariffPrice(tariff: Tariff): string {
  if (!tariff.period) return tariff.priceLabel;
  return `${tariff.priceLabel} / ${tariff.period.replace(/^par\s+/, "")}`;
}

export function computeDiscountedPriceCents(
  tariff: Tariff,
  reduction: TariffReduction | null,
): number | null {
  if (!reduction || tariff.priceCents === null) return null;
  if (reduction.isFree) return 0;
  if (reduction.reductionPercent !== null) {
    return Math.round(
      tariff.priceCents * (1 - reduction.reductionPercent / 100),
    );
  }
  return null;
}

export function formatPriceCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export function formatTariffPriceWithReduction(
  tariff: Tariff,
  reduction: TariffReduction | null,
): string {
  const discounted = computeDiscountedPriceCents(tariff, reduction);
  if (discounted === null || !tariff.period) return formatTariffPrice(tariff);
  const periodLabel = tariff.period.replace(/^par\s+/, "");
  return `${formatPriceCents(discounted)} / ${periodLabel}`;
}

export function todayFr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

export function parseFrDate(value: string): Date | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, day, month, year] = m;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function formatFrDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

export function computeAge(birthDate: string): number | null {
  const d = parseFrDate(birthDate);
  if (!d) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  )
    a -= 1;
  return a;
}
