/**
 * Formate un IBAN en groupes de 4 caractères pour la lecture
 * (ex: "FR7630001007941234567890185" -> "FR76 3000 1007 9412 3456 7890 185").
 * N'effectue aucun masquage : utile sur les écrans où l'utilisateur consulte
 * son propre IBAN (ce n'est pas une vue tierce, donc pas besoin de masquer).
 */
export function formatIbanDisplay(iban: string): string {
  const cleaned = iban.replace(/\s+/g, "");
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Masque un IBAN pour affichage condensé (liste), garde le code pays et les
 * 4 derniers chiffres.
 */
export function maskIbanDisplay(iban: string): string {
  const cleaned = iban.replace(/\s+/g, "");
  const country = cleaned.slice(0, 2);
  const last4 = cleaned.slice(-4);
  const masked = `${country}${"•".repeat(Math.max(cleaned.length - 6, 0))}${last4}`;
  return masked.replace(/(.{4})/g, "$1 ").trim();
}
