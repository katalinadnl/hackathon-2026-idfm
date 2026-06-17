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
