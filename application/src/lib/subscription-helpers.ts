export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatAmount(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function getAge(birthDate: string) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function monthsUntil(iso: string) {
  const end = new Date(iso);
  const today = new Date();
  return (
    (end.getFullYear() - today.getFullYear()) * 12 +
    (end.getMonth() - today.getMonth())
  );
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