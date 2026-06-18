import type { Tariff, TariffReduction } from "@/lib/api/tariffs";
import type { BeneficiaryStatus } from "@/types/beneficiary";

export interface TariffRecommendation {
  recommended: Tariff | null;
  reason: string | null;
  advisory: string | null;
}

function computeAge(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const beforeBirthdayThisYear =
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() < birthDate.getDate());
  if (beforeBirthdayThisYear) age -= 1;
  return age;
}

function findByName(tariffs: Tariff[], needle: string): Tariff | null {
  const lower = needle.toLowerCase();
  return tariffs.find((t) => t.name.toLowerCase().includes(lower)) ?? null;
}

function findAvailableByName(
  tariffs: Tariff[],
  needle: string,
  held: ReadonlySet<number>,
): Tariff | null {
  const match = findByName(tariffs, needle);
  return match && !held.has(match.id) ? match : null;
}

function firstAvailable(
  tariffs: Tariff[],
  held: ReadonlySet<number>,
): Tariff | null {
  return tariffs.find((t) => !held.has(t.id)) ?? null;
}

function findReduction(
  tariff: Tariff | null,
  ...needles: string[]
): TariffReduction | null {
  if (!tariff) return null;
  for (const needle of needles) {
    const lower = needle.toLowerCase();
    const match = tariff.reductions.find((r) =>
      r.name.toLowerCase().includes(lower),
    );
    if (match) return match;
  }
  return null;
}

function formatReductionAdvisory(
  reduction: TariffReduction | null,
  fallback: string,
): string {
  if (!reduction) return fallback;
  const benefit = reduction.isFree
    ? "la gratuité"
    : reduction.reductionPercent
      ? `une réduction de ${reduction.reductionPercent} %`
      : "une réduction";
  const condition = reduction.indication
    ? ` (${reduction.name}, ${reduction.indication})`
    : ` (${reduction.name})`;
  return `Selon votre situation, vous pourriez bénéficier de ${benefit} sur ce forfait${condition} — à vérifier auprès d'Île-de-France Mobilités.`;
}

export function recommendTariff(
  tariffs: Tariff[],
  status: BeneficiaryStatus | null,
  birthDate: Date | null,
  alreadyHeldTariffIds: ReadonlySet<number> = new Set(),
): TariffRecommendation {
  const age = computeAge(birthDate);
  const held = alreadyHeldTariffIds;
  const navigoAnnuel = findAvailableByName(tariffs, "navigo annuel", held);

  if (status === "MINOR") {
    if (age !== null && age < 11) {
      const junior = findAvailableByName(tariffs, "imagine r junior", held);
      if (junior) {
        return { recommended: junior, reason: "Moins de 11 ans", advisory: null };
      }
    }
    const scolaire = findAvailableByName(tariffs, "imagine r scolaire", held);
    if (scolaire) {
      return {
        recommended: scolaire,
        reason: "Élève du primaire, du secondaire ou apprenti",
        advisory: null,
      };
    }
  }

  if (status === "STUDENT") {
    const etudiant =
      findAvailableByName(tariffs, "imagine r étudiant", held) ??
      findAvailableByName(tariffs, "imagine r etudiant", held);
    if (etudiant) {
      return { recommended: etudiant, reason: "Étudiant", advisory: null };
    }
  }

  if (status === "SENIOR" && navigoAnnuel) {
    const reduction = findReduction(navigoAnnuel, "senior");
    return {
      recommended: navigoAnnuel,
      reason: "Senior",
      advisory: formatReductionAdvisory(
        reduction,
        "En tant que senior (62 ans et plus), vous pourriez bénéficier d'une réduction sous condition (Forfait Navigo Annuel Tarification Senior) — à vérifier auprès d'Île-de-France Mobilités.",
      ),
    };
  }

  if (status === "DISABLED" && navigoAnnuel) {
    const reduction =
      findReduction(navigoAnnuel, "handicap") ??
      findReduction(navigoAnnuel, "améthyste");
    return {
      recommended: navigoAnnuel,
      reason: "Statut handicap",
      advisory: formatReductionAdvisory(
        reduction,
        "Selon votre situation, vous pourriez bénéficier d'une gratuité ou d'une réduction de 50 % (Forfait Améthyste ou réduction handicap), sous conditions — à vérifier auprès d'Île-de-France Mobilités.",
      ),
    };
  }

  if (status === "UNEMPLOYED" && navigoAnnuel) {
    const reduction = findReduction(navigoAnnuel, "solidarité");
    return {
      recommended: navigoAnnuel,
      reason: "Sans emploi",
      advisory: formatReductionAdvisory(
        reduction,
        "Selon votre quotient familial, vous pourriez bénéficier d'une réduction Solidarité Transport (jusqu'à la gratuité), sous conditions — à vérifier auprès d'Île-de-France Mobilités.",
      ),
    };
  }

  if (navigoAnnuel) {
    return {
      recommended: navigoAnnuel,
      reason: "Recommandation par défaut",
      advisory: null,
    };
  }

  const fallback = firstAvailable(tariffs, held);
  return {
    recommended: fallback,
    reason: fallback
      ? "Vous avez déjà la formule habituellement recommandée pour votre profil : voici une autre formule disponible."
      : null,
    advisory: null,
  };
}