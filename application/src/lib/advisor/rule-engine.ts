import { ApiSubscription } from "@/hooks/use-subscriptions";

export type ActionId =
  | "renew"
  | "add_document"
  | "block_pass"
  | "new_pass"
  | "change_payer"
  | "regularize"
  | "download_cert"
  | "view_offers";

export interface AdvisorResponse {
  answer: string;
  simplified: string;
  actions: ActionId[];
}

interface Rule {
  keywords: string[];
  respond: (subs: ApiSubscription[]) => AdvisorResponse;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
}

const rules: Rule[] = [
  {
    keywords: ["renouveler", "renouvellement", "expir", "imagine r", "imagine", "enfant", "scol"],
    respond: (subs) => {
      const expiring = subs.find((s) => {
        const d = daysUntil(s.endDate);
        return d > 0 && d <= 60;
      });
      return {
        answer: expiring
          ? `Votre abonnement **${expiring.subscriptionType}** (titulaire : ${expiring.beneficiary.firstName} ${expiring.beneficiary.lastName}) expire le **${fmt(expiring.endDate)}**.\n\nPour renouveler, rendez-vous dans "Gérer" sur votre abonnement. Pour un Imagine R, un justificatif scolaire à jour sera demandé.`
          : "Aucun abonnement n'expire dans les 60 prochains jours. Le renouvellement est disponible entre J-30 et la date d'expiration. Pour un Imagine R, préparez le justificatif scolaire de la nouvelle année.",
        simplified:
          "Votre abonnement se renouvelle avant qu'il s'arrête. Pour un pass enfant, on vous demande un papier de l'école.",
        actions: ["renew", "view_offers"],
      };
    },
  },
  {
    keywords: ["perdu", "vole", "volé", "bloquer", "opposition", "subtilise"],
    respond: () => ({
      answer:
        "En cas de pass perdu ou volé :\n\n1. **Bloquez votre pass** immédiatement.\n2. Votre crédit et abonnement sont sauvegardés.\n3. Commandez un **nouveau pass** (3–5 jours ouvrés).\n4. En cas de vol, joignez une copie de dépôt de plainte.",
      simplified:
        "Pass perdu ? Bloquez-le vite. Votre abonnement ne disparaît pas. Vous pouvez en demander un nouveau.",
      actions: ["block_pass", "new_pass"],
    }),
  },
  {
    keywords: ["bours", "caf", "college", "lycee", "universite", "etudiant"],
    respond: () => ({
      answer:
        "Pour un abonnement **Imagine R Scolaire**, vous devez fournir :\n- Une **attestation de scolarité** de l'année en cours\n- Un justificatif de domicile récent\n- Si boursier : la **notification de bourse** (CAF ou Rectorat)\n\nDéposez ces documents avant la date de renouvellement pour éviter toute interruption.",
      simplified:
        "Pour l'abonnement enfant, donnez le papier de l'école. Si vous avez une bourse, donnez aussi le papier de la bourse.",
      actions: ["add_document"],
    }),
  },
  {
    keywords: ["payeur", "rib", "sepa", "prelevement", "virement", "tiers payeur"],
    respond: (subs) => {
      const isTitulaire = subs.some((s) => s.roles.includes("titulaire"));
      const isPayeur = subs.some((s) => s.roles.includes("payeur"));
      return {
        answer: `Le système **porteur/payeur** sépare celui qui utilise le pass (titulaire) de celui qui paye.\n\n${isTitulaire ? "Vous êtes **titulaire** sur un ou plusieurs abonnements." : ""}${isPayeur ? " Vous êtes également **payeur**." : ""}\n\nPour changer le payeur, fournissez un nouveau RIB et un mandat SEPA. La modification prend effet au prochain cycle.`,
        simplified:
          "Le payeur paye. Le porteur utilise le pass. Ce sont deux personnes différentes, c'est possible.",
        actions: ["change_payer"],
      };
    },
  },
  {
    keywords: ["paiement", "echoue", "rejete", "impaye", "regulariser", "facture"],
    respond: (subs) => {
      const failed = subs.find(
        (s) =>
          s.latestPayment?.status === "failed" ||
          s.latestPayment?.status === "rejected",
      );
      return {
        answer: failed
          ? `Un paiement a échoué pour **${failed.subscriptionType}**.\n\n1. Vérifiez que votre **RIB est valide** et le compte approvisionné.\n2. Cliquez sur "Régulariser" pour relancer le prélèvement.\n3. Sans régularisation sous 15 jours, l'abonnement peut être suspendu.`
          : "Aucun incident de paiement détecté. Si vous avez reçu un email d'échec, vérifiez la validité de votre RIB dans Facturation.",
        simplified:
          "Si un paiement n'a pas marché, vérifiez votre compte bancaire et réessayez.",
        actions: ["regularize", "download_cert"],
      };
    },
  },
  {
    keywords: ["justificatif", "document", "attestation", "certificat", "piece", "dossier", "incomplet", "manquant"],
    respond: () => ({
      answer:
        "Documents disponibles dans votre espace :\n\n- **Attestation de transport** : preuve d'abonnement (remboursement employeur)\n- **Facture mensuelle** : détail des prélèvements\n- **Justificatif de domicile** : pour abonnements sociaux\n- **Attestation scolaire** : pour Imagine R\n\nTéléchargez-les depuis la section Facturation.",
      simplified:
        "Vous avez besoin d'un papier ? Allez dans \"Facturation\" pour le télécharger.",
      actions: ["download_cert", "add_document"],
    }),
  },
  {
    keywords: ["senior", "retraite", "navigo senior", "3eme", "carte senior"],
    respond: () => ({
      answer:
        "Le **Navigo Senior** est destiné aux personnes de **70 ans et plus** (ou 65 ans sous conditions de ressources).\n\nAvantages : tarif réduit, valable sur RER, métro, bus et tramway, sans justificatif annuel.\n\nContactez le service client IDF Mobilités pour en bénéficier.",
      simplified: "Le pass senior coûte moins cher pour les personnes âgées.",
      actions: ["view_offers"],
    }),
  },
  {
    keywords: ["demandeur emploi", "chomage", "solidarite", "tst", "tarification solidarite", "rsa", "aah"],
    respond: () => ({
      answer:
        "La **Tarification Solidarité Transport (TST)** réduit le coût des transports pour les personnes en difficulté.\n\nConditions : demandeur d'emploi ou bénéficiaire de minima sociaux (RSA, AAH, ASS…), résidant en Île-de-France.\n\nDocuments : attestation Pôle Emploi ou notification de minima social. La réduction peut atteindre **50 %**.",
      simplified:
        "Si vous cherchez du travail ou avez peu de revenus, vous payez moins cher. Montrez un papier de Pôle Emploi.",
      actions: ["add_document", "view_offers"],
    }),
  },
  {
    keywords: ["simple", "comprends pas", "comprend pas", "expliquer", "c est quoi", "comment ca marche"],
    respond: (subs) => {
      const sub = subs[0];
      return {
        answer: sub
          ? `En clair : votre abonnement **${sub.subscriptionType}** vous permet de prendre tous les transports d'Île-de-France dans vos zones. Chaque mois, un prélèvement automatique est effectué. Si vous avez un problème, je suis là.`
          : "Je suis votre assistant pour tout ce qui concerne vos transports. Posez-moi une question sur votre pass, vos paiements ou vos documents.",
        simplified: "Posez-moi votre question, je vous explique simplement.",
        actions: ["view_offers"],
      };
    },
  },
  {
    keywords: ["statut", "dossier", "en cours", "traitement"],
    respond: (subs) => {
      const pending = subs.find((s) => s.status === "pending" || s.status === "incomplete");
      return {
        answer: pending
          ? `Votre dossier **${pending.subscriptionType}** est en cours de traitement (statut : ${pending.status}). Il manque peut-être un justificatif. Vérifiez les documents requis et téléversez-les si nécessaire.`
          : "Tous vos dossiers semblent complets. Si vous attendez une validation, comptez 3 à 5 jours ouvrés après envoi des documents.",
        simplified: "Votre dossier est en train d'être vérifié. Si on vous demande un papier, envoyez-le vite.",
        actions: ["add_document"],
      };
    },
  },
];

export function matchRules(
  input: string,
  subscriptions: ApiSubscription[],
): AdvisorResponse {
  const normalized = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  for (const rule of rules) {
    if (
      rule.keywords.some((kw) =>
        normalized.includes(
          kw
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, ""),
        ),
      )
    ) {
      return rule.respond(subscriptions);
    }
  }

  return {
    answer:
      "Je n'ai pas trouvé de réponse précise. Je peux vous aider sur :\n\n- **Renouveler** un abonnement\n- **Bloquer** un pass perdu ou volé\n- Les **justificatifs** à fournir\n- Un **paiement échoué**\n- Les offres **senior**, **étudiant** ou **solidarité**\n\nReformullez votre question ou choisissez une action ci-dessous.",
    simplified:
      "Je n'ai pas compris. Dites-moi ce qui ne va pas avec votre pass.",
    actions: ["view_offers"],
  };
}

export const INITIAL_MESSAGE: AdvisorResponse = {
  answer:
    "Bonjour ! Je suis votre **Conseiller IA Mobilité** Comutitres.\n\nJe peux vous aider à :\n- Renouveler ou gérer vos abonnements\n- Déclarer un pass perdu ou volé\n- Comprendre vos justificatifs et paiements\n- Vous orienter vers les offres adaptées\n\nQue puis-je faire pour vous ?",
  simplified:
    "Bonjour ! Je suis là pour vous aider avec vos transports. Posez-moi une question.",
  actions: [],
};
