import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import type { ApiSubscription } from "@/hooks/use-subscriptions";

import { useTariffs } from "@/hooks/useTariffs";
import { beneficiariesApi } from "@/lib/api/beneficiaries";
import type { Tariff, TariffReduction } from "@/lib/api/tariffs";
import { recommendTariff } from "@/lib/recommendTariff";
import { ApiError } from "@/services/api";
import type { BeneficiaryStatus } from "@/types/beneficiary";
import { statusVerificationsApi } from "@/lib/api/statusVerification";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import type { PaymentMode } from "@/lib/api/subscriptions";
import { createBankInfo } from "@/lib/api/bank-info";
import { createSubscriptionCheckout } from "@/lib/api/billing";
import { http } from "@/services/api";
import type { AuthUser } from "@/lib/api/auth";

// ─── Types & static data (alignés sur schema.prisma) ───────────────────────

type Target = "self" | "other";
type Step =
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

const STEP_FLOW: Step[] = [
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

const STATUS_OPTIONS: { value: BeneficiaryStatus; label: string }[] = [
  { value: "ACTIVE", label: "Actif" },
  { value: "STUDENT", label: "Étudiant" },
  { value: "SENIOR", label: "Senior" },
  { value: "UNEMPLOYED", label: "Sans emploi" },
  { value: "DISABLED", label: "En situation de handicap" },
  { value: "MINOR", label: "Mineur" },
];

// ─── Données et helpers de simulation ──────────────────────────────────────

const FALLBACK_SCAN_NAME = { firstName: "Camille", lastName: "Lefèvre" };
const MOCK_SCAN_BIRTHDATE = "14/03/1995";
const SIMULATED_BIRTHDATE_FC = "22/11/1989";
const SIMULATED_RESIDENCE_CODE = "75";
const SIMULATED_WORK_CODE = "92";

function guessNameFromEmail(email: string): {
  firstName: string;
  lastName: string;
} {
  const local = (email.split("@")[0] ?? "").replace(/\d+$/, "");
  const parts = local.split(/[._-]+/).filter(Boolean);
  const cap = (v: string) =>
    v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
  return {
    firstName: parts[0] ? cap(parts[0]) : "",
    lastName: parts[1] ? cap(parts[1]) : "",
  };
}

function pickRandomStatus(excludeMinor = false): BeneficiaryStatus {
  const options = excludeMinor
    ? STATUS_OPTIONS.filter((o) => o.value !== "MINOR")
    : STATUS_OPTIONS;
  const idx = Math.floor(Math.random() * options.length);
  return options[idx].value;
}

function generateSimulatedSsn(birth: string, deptCode: string): string {
  const parsed = parseFrDate(birth);
  const yy = parsed ? String(parsed.getFullYear()).slice(-2) : "00";
  const mm = parsed ? String(parsed.getMonth() + 1).padStart(2, "0") : "00";
  return `1 ${yy} ${mm} ${deptCode} 123 456 78`;
}

const PLAN_DURATION_MONTHS = 12;

function formatTariffPrice(tariff: Tariff): string {
  if (!tariff.period) return tariff.priceLabel;
  return `${tariff.priceLabel} / ${tariff.period.replace(/^par\s+/, "")}`;
}

function computeDiscountedPriceCents(
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

function formatPriceCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function formatTariffPriceWithReduction(
  tariff: Tariff,
  reduction: TariffReduction | null,
): string {
  const discounted = computeDiscountedPriceCents(tariff, reduction);
  if (discounted === null || !tariff.period) return formatTariffPrice(tariff);
  const periodLabel = tariff.period.replace(/^par\s+/, "");
  return `${formatPriceCents(discounted)} / ${periodLabel}`;
}

function todayFr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1,
  ).padStart(2, "0")}/${d.getFullYear()}`;
}

function parseFrDate(value: string): Date | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, day, month, year] = m;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatFrDate(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

// ─── Reusable bits ──────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function RecapRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.recapRow, !last && s.recapRowBorder]}>
      <Text style={s.recapLabel}>{label}</Text>
      <Text style={s.recapValue}>{value}</Text>
    </View>
  );
}

function StepActions({
  onBack,
  onContinue,
  continueLabel = "Continuer",
  continueIcon = "arrow-right",
  disabled,
}: {
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueIcon?: string;
  disabled?: boolean;
}) {
  return (
    <View style={s.stepActions}>
      <Button
        variant="secondary"
        leadingIcon="arrow-left"
        style={s.stepActionBtn}
        disabled={disabled}
        onPress={onBack}
      >
        Précédent
      </Button>
      <Button
        trailingIcon={continueIcon}
        style={s.stepActionBtn}
        disabled={disabled}
        onPress={onContinue}
      >
        {continueLabel}
      </Button>
    </View>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    departments,
    loading: departmentsLoading,
    error: departmentsError,
    reload: reloadDepartments,
  } = useDepartments();
  const {
    tariffs,
    loading: tariffsLoading,
    error: tariffsError,
    reload: reloadTariffs,
  } = useTariffs();

  const { subscriptions: mySubscriptions } = useSubscriptions(user?.id ?? null);

  const heldLongPlans = useMemo(() => {
    const tariffsByName = new Map(tariffs.map((t) => [t.name, t.id]));
    const tariffIds = new Set(tariffs.map((t) => t.id));
    const now = new Date();
    const map = new Map<number, ApiSubscription>();
    for (const sub of mySubscriptions) {
      if (sub.status !== "active" || new Date(sub.endDate) < now) continue;
      const tariffId =
        sub.transportProductId ?? tariffsByName.get(sub.subscriptionType);
      if (
        tariffId !== undefined &&
        tariffId !== null &&
        tariffIds.has(tariffId)
      ) {
        map.set(tariffId, sub);
      }
    }
    return map;
  }, [mySubscriptions, tariffs]);

  const params = useLocalSearchParams<{ for?: string }>();
  const initialTarget: Target | null =
    params.for === "self" || params.for === "other" ? params.for : null;

  const hasIdentity = Boolean(
    user?.firstName?.trim() && user?.lastName?.trim(),
  );

  const [target, setTarget] = useState<Target | null>(initialTarget);
  const showScan = target !== null && !(target === "self" && hasIdentity);

  const [status, setStatus] = useState<BeneficiaryStatus | null>(null);
  const [birthDate, setBirthDate] = useState("");

  const age = useMemo(() => {
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
  }, [birthDate]);

  useEffect(() => {
    if (age === null) return;
    if (age >= 62) setStatus("SENIOR");
    else if (age < 16) setStatus("MINOR");
  }, [age]);

  const heldTariffIds = useMemo(
    () =>
      target === "self" ? new Set(heldLongPlans.keys()) : new Set<number>(),
    [target, heldLongPlans],
  );

  const recommendation = useMemo(
    () =>
      recommendTariff(tariffs, status, parseFrDate(birthDate), heldTariffIds),
    [tariffs, status, birthDate, heldTariffIds],
  );

  const showReductionProof = recommendation.reduction !== null;

  const visibleSteps = useMemo<Step[]>(
    () =>
      STEP_FLOW.filter((st) => {
        if (st === "target") return !initialTarget;
        if (st === "scan") return showScan;
        if (st === "reduction-proof") return showReductionProof;
        return true;
      }),
    [initialTarget, showScan, showReductionProof],
  );

  const [step, setStep] = useState<Step>(visibleSteps[0]);

  const [scanState, setScanState] = useState<"idle" | "scanning" | "done">(
    "idle",
  );

  // ── Reduction proof fields ──
  const [proofState, setProofState] = useState<"idle" | "uploading" | "done">(
    "idle",
  );
  const [proofSource, setProofSource] = useState<
    "MANUAL_DOCUMENT" | "DECLARATIVE" | null
  >(null);
  const [proofDocumentName, setProofDocumentName] = useState<string | null>(
    null,
  );

  // ── Beneficiary fields ──
  const [firstName, setFirstName] = useState(() =>
    initialTarget === "self" ? (user?.firstName ?? "") : "",
  );
  const [lastName, setLastName] = useState(() =>
    initialTarget === "self" ? (user?.lastName ?? "") : "",
  );
  const [email, setEmail] = useState(() =>
    initialTarget === "self" ? (user?.email ?? "") : "",
  );
  const [phone, setPhone] = useState("");
  const [ssn, setSsn] = useState("");
  const [residenceDept, setResidenceDept] = useState<string | null>(null);
  const [workDept, setWorkDept] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Subscription fields ──
  const [planId, setPlanId] = useState<number | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [startDate, setStartDate] = useState(todayFr);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Payment fields ──
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [holderName, setHolderName] = useState(() =>
    [user?.firstName, user?.lastName].filter(Boolean).join(" "),
  );

  const selectedPlan = useMemo(
    () => tariffs.find((t) => t.id === planId) ?? null,
    [planId, tariffs],
  );

  useEffect(() => {
    if (step === "plan" && planId === null && recommendation.recommended) {
      setPlanId(recommendation.recommended.id);
    }
  }, [step, planId, recommendation.recommended]);

  const stepIndex = visibleSteps.indexOf(step);
  const totalSteps = visibleSteps.length - 1;

  function goNext() {
    const idx = visibleSteps.indexOf(step);
    if (idx >= 0 && idx < visibleSteps.length - 1) {
      setStep(visibleSteps[idx + 1]);
    }
  }

  function goBack() {
    const idx = visibleSteps.indexOf(step);
    if (idx <= 0) {
      router.back();
      return;
    }
    setStep(visibleSteps[idx - 1]);
  }

  function selectTarget(t: Target) {
    setTarget(t);

    if (t === "self" && hasIdentity) {
      setEmail(user?.email ?? "");
      setFirstName(user?.firstName ?? "");
      setLastName(user?.lastName ?? "");
      setBirthDate(SIMULATED_BIRTHDATE_FC);
      simulateGovernmentLookup(SIMULATED_BIRTHDATE_FC);
      setStep("profile");
      return;
    }

    setEmail(t === "self" ? (user?.email ?? "") : "");
    setFirstName("");
    setLastName("");
    setBirthDate("");
    setScanState("idle");
    setStep("scan");
  }

  function simulateGovernmentLookup(birth: string) {
    let residenceCode = SIMULATED_RESIDENCE_CODE;
    let workCode: string | null = SIMULATED_WORK_CODE;

    if (departments.length > 0) {
      const residence =
        departments[Math.floor(Math.random() * departments.length)];
      const workCandidates = departments.filter(
        (d) => d.code !== residence.code,
      );
      const work =
        workCandidates.length > 0
          ? workCandidates[Math.floor(Math.random() * workCandidates.length)]
          : null;
      residenceCode = residence.code;
      workCode = work ? work.code : null;
    }

    setResidenceDept(residenceCode);
    setWorkDept(workCode);

    const parsed = parseFrDate(birth);
    if (parsed) {
      const now = new Date();
      let a = now.getFullYear() - parsed.getFullYear();
      if (
        now.getMonth() < parsed.getMonth() ||
        (now.getMonth() === parsed.getMonth() &&
          now.getDate() < parsed.getDate())
      )
        a -= 1;
      if (a >= 62) {
        setStatus("SENIOR");
        return;
      }
      if (a < 16) {
        setStatus("MINOR");
        return;
      }
    }
    setStatus(pickRandomStatus(true));
  }

  function regenerateStatus() {
    setStatus(pickRandomStatus());
  }

  function runScanSimulation() {
    setScanState("scanning");
    setTimeout(() => {
      const guessed =
        target === "self" && user?.email
          ? guessNameFromEmail(user.email)
          : { firstName: "", lastName: "" };
      const result = {
        firstName: guessed.firstName || FALLBACK_SCAN_NAME.firstName,
        lastName: guessed.lastName || FALLBACK_SCAN_NAME.lastName,
        birthDate: MOCK_SCAN_BIRTHDATE,
      };
      setFirstName(result.firstName);
      setLastName(result.lastName);
      setBirthDate(result.birthDate);
      setScanState("done");
    }, 1400);
  }

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (result.canceled) return;
      runScanSimulation();
    } catch {}
  }

  function skipScan() {
    goNext();
  }

  function continueFromScan() {
    simulateGovernmentLookup(birthDate || MOCK_SCAN_BIRTHDATE);
    goNext();
  }

  useEffect(() => {
    if (initialTarget === "self" && hasIdentity) {
      setBirthDate(SIMULATED_BIRTHDATE_FC);
      simulateGovernmentLookup(SIMULATED_BIRTHDATE_FC);
    }
  }, []);

  function validateProfile(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!lastName.trim()) next.lastName = "Le nom est requis.";
    if (!email.trim()) {
      next.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "L'adresse email semble invalide.";
    }
    if (!birthDate.trim()) {
      next.birthDate = "La date de naissance est requise.";
    } else if (!parseFrDate(birthDate)) {
      next.birthDate = "Format attendu : JJ/MM/AAAA.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateAddress(): boolean {
    const next: Record<string, string> = {};
    if (!residenceDept) {
      next.residenceDept = "Le département de résidence est requis.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateStatus(): boolean {
    const next: Record<string, string> = {};
    if (!status) next.status = "Le statut est requis.";
    if (status === "DISABLED" && !ssn.trim())
      next.ssn = "Le numéro de sécurité sociale est requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePlan(): boolean {
    const next: Record<string, string> = {};
    if (!planId) next.plan = "Choisissez une formule.";
    if (!startDate.trim()) {
      next.startDate = "La date de début est requise.";
    } else if (!parseFrDate(startDate)) {
      next.startDate = "Format attendu : JJ/MM/AAAA.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validatePayment(): boolean {
    const next: Record<string, string> = {};
    if (!paymentMode) {
      next.paymentMode = "Choisissez un mode de paiement.";
    } else if (paymentMode === "SEPA_MONTHLY" || paymentMode === "SEPA_ONCE") {
      if (!iban.trim()) {
        next.iban = "L'IBAN est requis.";
      } else if (iban.replace(/\s/g, "").length < 15) {
        next.iban = "L'IBAN semble trop court.";
      }
      if (!holderName.trim())
        next.holderName = "Le nom du titulaire est requis.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueFromProfile() {
    if (!validateProfile()) return;
    if (!residenceDept) {
      simulateGovernmentLookup(birthDate);
    }
    goNext();
  }

  function continueFromAddress() {
    if (!validateAddress()) return;
    goNext();
  }

  function continueFromStatus() {
    if (!validateStatus()) return;
    goNext();
  }

  async function pickReductionProof() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (result.canceled) return;
      setProofState("uploading");
      setTimeout(() => {
        setProofSource("MANUAL_DOCUMENT");
        setProofDocumentName(result.assets[0]?.name ?? "justificatif.pdf");
        setProofState("done");
      }, 600);
    } catch {}
  }

  function skipReductionProof() {
    setProofSource("DECLARATIVE");
    goNext();
  }

  function continueFromReductionProof() {
    goNext();
  }

  function continueFromPlan() {
    if (!validatePlan()) return;
    goNext();
  }

  async function confirm() {
    if (!selectedPlan || !status || !paymentMode) return;
    if (!validatePayment()) return;

    const startDateObjForSubmit = parseFrDate(startDate);
    if (!startDateObjForSubmit) return;
    const endDateObjForSubmit = addMonths(
      startDateObjForSubmit,
      PLAN_DURATION_MONTHS,
    );

    const residenceDepartmentId = departments.find(
      (d) => d.code === residenceDept,
    )?.id;
    const workStudyDepartmentId = departments.find(
      (d) => d.code === workDept,
    )?.id;

    if (!residenceDepartmentId) {
      setSubmitError("Le département de résidence est invalide.");
      return;
    }

    const birthDateObj = parseFrDate(birthDate);
    if (!birthDateObj) {
      setSubmitError("La date de naissance est invalide.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let beneficiaryId: number;

      if (target === "self" && user?.beneficiaryId) {
        beneficiaryId = user.beneficiaryId;
      } else {
        try {
          const beneficiary = await beneficiariesApi.create({
            firstName,
            lastName,
            email,
            phone: phone.trim() || undefined,
            birthDate: birthDateObj.toISOString(),
            socialSecurityNumber: ssn.trim() || undefined,
            status,
            residenceDepartmentId,
            workStudyDepartmentId,
            linkToMe: target === "self",
          });
          beneficiaryId = beneficiary.id;
        } catch (createErr) {
          if (
            createErr instanceof ApiError &&
            createErr.status === 409 &&
            target === "self"
          ) {
            const me = await http.get<AuthUser>("/auth/me");
            if (me?.beneficiaryId) {
              beneficiaryId = me.beneficiaryId;
            } else {
              throw createErr;
            }
          } else {
            throw createErr;
          }
        }
      }

      const isSepa = paymentMode === "SEPA_MONTHLY" || paymentMode === "SEPA_ONCE";
      const bankInfo = await createBankInfo({
        accountId: user!.id,
        iban: isSepa
          ? iban.replace(/\s/g, "")
          : "FR7600000000000000000000000",
        bic: isSepa && bic.trim() ? bic.trim() : undefined,
        holderName: isSepa
          ? holderName.trim()
          : [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            "CB",
        isDefault: true,
      });

      const subscription = await subscriptionsApi.create({
        beneficiaryId,
        referrerId: user?.id,
        subscriptionType: selectedPlan.name,
        transportProductId: selectedPlan.id,
        startDate: startDateObjForSubmit.toISOString(),
        endDate: endDateObjForSubmit.toISOString(),
        bankInfoId: bankInfo.id,
        paymentMode,
      });

      if (
        recommendation.reduction &&
        proofSource &&
        selectedPlan.id === recommendation.recommended?.id
      ) {
        await statusVerificationsApi.create({
          beneficiaryId,
          status,
          source: proofSource,
          tariffReductionId: recommendation.reduction.id,
          documentUrl:
            proofSource === "MANUAL_DOCUMENT"
              ? (proofDocumentName ?? undefined)
              : undefined,
          verified: proofSource === "MANUAL_DOCUMENT",
        });
      }

      if (paymentMode === "CARD_ONCE") {
        const checkout = await createSubscriptionCheckout(subscription.id);
        if (checkout.url) {
          window.location.href = checkout.url;
          return;
        }
        setSubmitError(
          checkout.message || "Impossible de créer la session de paiement.",
        );
        setSubmitting(false);
        return;
      }

      setStep("success");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Une erreur est survenue, réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const beneficiaryLabel =
    [firstName, lastName].filter(Boolean).join(" ") || "—";
  const residenceDeptLabel = departments.find((d) => d.code === residenceDept);
  const workDeptLabel = departments.find((d) => d.code === workDept);
  const statusLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label;

  const startDateObj = parseFrDate(startDate);
  const endDateLabel =
    selectedPlan && startDateObj
      ? formatFrDate(addMonths(startDateObj, PLAN_DURATION_MONTHS))
      : null;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.wrapper}>
          <View style={s.header}>
            <Pressable
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel="Retour"
              style={s.backBtn}
            >
              <Icon name="arrow-left" size={20} color={DS.textStrong} />
            </Pressable>
            <View style={s.headerText}>
              <Text style={s.title}>Nouvel abonnement</Text>
              {step !== "success" && (
                <Text style={s.stepIndicator}>
                  Étape {stepIndex + 1} sur {totalSteps}
                </Text>
              )}
            </View>
          </View>

          {step === "target" && (
            <View style={s.section}>
              <Text style={s.sectionLead}>
                Pour qui souhaitez-vous souscrire ce nouvel abonnement ?
              </Text>

              <Card style={s.choiceCard}>
                <View style={s.choiceIcon}>
                  <Icon name="person" size={22} color={DS.actionPrimary} />
                </View>
                <View style={s.choiceText}>
                  <Text style={s.choiceTitle}>Pour moi</Text>
                  <Text style={s.choiceDesc}>
                    Vous serez titulaire et payeur de l&apos;abonnement.
                  </Text>
                </View>
                <Button
                  size="sm"
                  trailingIcon="arrow-right"
                  onPress={() => selectTarget("self")}
                >
                  Choisir
                </Button>
              </Card>

              <Card style={s.choiceCard}>
                <View style={s.choiceIcon}>
                  <Icon name="user-plus" size={22} color={DS.actionPrimary} />
                </View>
                <View style={s.choiceText}>
                  <Text style={s.choiceTitle}>Pour une autre personne</Text>
                  <Text style={s.choiceDesc}>
                    Un proche sera titulaire ; vous serez référent et payeur.
                  </Text>
                </View>
                <Button
                  size="sm"
                  variant="secondary"
                  trailingIcon="arrow-right"
                  onPress={() => selectTarget("other")}
                >
                  Choisir
                </Button>
              </Card>
            </View>
          )}

          {step === "scan" && (
            <View style={s.section}>
              <SectionTitle>Vérification d&apos;identité</SectionTitle>
              <Text style={s.sectionLead}>
                {target === "self"
                  ? "Votre compte ne contient pas encore d'identité vérifiée. Scannez votre carte d'identité ou votre passeport pour pré-remplir vos informations (simulation : aucun document réel n'est analysé)."
                  : "Scannez ou importez la carte d'identité ou le passeport de cette personne pour pré-remplir ses informations (simulation : aucun document réel n'est analysé)."}
              </Text>

              <Card style={s.scanCard}>
                <View
                  style={[s.scanIcon, scanState === "done" && s.scanIconDone]}
                >
                  <Icon
                    name={scanState === "done" ? "check" : "creditcard"}
                    size={26}
                    color={scanState === "done" ? DS.white : DS.actionPrimary}
                  />
                </View>

                {scanState === "idle" && (
                  <>
                    <Text style={s.scanText}>
                      Aucun document scanné pour le moment.
                    </Text>
                    <View style={s.scanActionsRow}>
                      <Button leadingIcon="camera" onPress={runScanSimulation}>
                        {target === "self"
                          ? "Scanner ma pièce d'identité"
                          : "Scanner sa pièce d'identité"}
                      </Button>
                      <Button
                        variant="secondary"
                        leadingIcon="upload"
                        onPress={pickDocument}
                      >
                        Importer un fichier
                      </Button>
                    </View>
                    <Pressable onPress={skipScan} style={s.skipScanLink}>
                      <Text style={s.skipScanLinkText}>
                        {target === "self"
                          ? "Je ne souhaite pas transmettre de document — renseigner mes informations moi-même"
                          : "Pas de document disponible — renseigner ses informations manuellement"}
                      </Text>
                    </Pressable>
                  </>
                )}

                {scanState === "scanning" && (
                  <View style={s.inlineLoading}>
                    <ActivityIndicator color={DS.actionPrimary} />
                    <Text style={s.noteText}>
                      Analyse du document en cours…
                    </Text>
                  </View>
                )}

                {scanState === "done" && (
                  <>
                    <Text style={s.scanText}>
                      Informations extraites avec succès.
                    </Text>
                    <View style={s.recapCard}>
                      <RecapRow label="Prénom" value={firstName} />
                      <RecapRow label="Nom" value={lastName} />
                      <RecapRow label="Naissance" value={birthDate} last />
                    </View>
                  </>
                )}
              </Card>

              {scanState === "done" ? (
                <StepActions onBack={goBack} onContinue={continueFromScan} />
              ) : (
                <Button
                  variant="secondary"
                  leadingIcon="arrow-left"
                  disabled={scanState === "scanning"}
                  onPress={goBack}
                >
                  Précédent
                </Button>
              )}
            </View>
          )}

          {step === "profile" && (
            <View style={s.section}>
              <SectionTitle>Profil</SectionTitle>

              {target === "self" && hasIdentity && (
                <Text style={s.noteText}>
                  Prénom, nom, email et date de naissance sont pré-remplis
                  depuis votre compte (simulation France Connect). Vous pouvez
                  les modifier si besoin.
                </Text>
              )}

              {showScan && scanState === "done" && (
                <Text style={s.noteText}>
                  {target === "self"
                    ? "Prénom, nom et date de naissance ont été extraits du scan de votre pièce d'identité (simulation)."
                    : "Prénom, nom et date de naissance ont été extraits du scan de la pièce d'identité de cette personne (simulation)."}{" "}
                  Vous pouvez les modifier si besoin.
                </Text>
              )}

              <View style={s.formRow}>
                <View style={s.formCol}>
                  <Input
                    label="Prénom"
                    value={firstName}
                    onChangeText={setFirstName}
                    error={errors.firstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={s.formCol}>
                  <Input
                    label="Nom"
                    value={lastName}
                    onChangeText={setLastName}
                    error={errors.lastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Téléphone (optionnel)"
                placeholder="06 12 34 56 78"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <Input
                label="Date de naissance"
                placeholder="JJ/MM/AAAA"
                value={birthDate}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, "").slice(0, 8);
                  let formatted = digits;
                  if (digits.length > 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                  } else if (digits.length > 2) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  }
                  setBirthDate(formatted);
                }}
                error={errors.birthDate}
                keyboardType="number-pad"
                maxLength={10}
              />

              <StepActions onBack={goBack} onContinue={continueFromProfile} />
            </View>
          )}

          {step === "address" && (
            <View style={s.section}>
              <SectionTitle>Adresse</SectionTitle>

              <Text style={s.noteText}>
                Sélectionnez votre département de résidence et, si applicable,
                votre département de travail ou d&apos;études.
              </Text>

              {departmentsLoading && (
                <View style={s.inlineLoading}>
                  <ActivityIndicator color={DS.actionPrimary} />
                  <Text style={s.noteText}>Chargement des départements…</Text>
                </View>
              )}

              {!departmentsLoading && departmentsError && (
                <View style={s.inlineError}>
                  <Icon name="alert-triangle" size={16} color={DS.dangerText} />
                  <Text style={s.inlineErrorText}>{departmentsError}</Text>
                  <Button
                    size="sm"
                    variant="secondary"
                    onPress={reloadDepartments}
                  >
                    Réessayer
                  </Button>
                </View>
              )}

              {!departmentsLoading && !departmentsError && (
                <>
                  <View>
                    <FieldLabel>Département de résidence</FieldLabel>
                    <View style={s.chipsRow}>
                      {departments.map((d) => {
                        const selected = residenceDept === d.code;
                        return (
                          <Pressable
                            key={d.code}
                            onPress={() => setResidenceDept(d.code)}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[s.chip, selected && s.chipSelected]}
                          >
                            <Text
                              style={[
                                s.chipLabel,
                                selected && s.chipLabelSelected,
                              ]}
                            >
                              {d.code} – {d.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {!!errors.residenceDept && (
                      <Text style={s.fieldError}>{errors.residenceDept}</Text>
                    )}
                  </View>

                  <View>
                    <FieldLabel>
                      Département de travail / d&apos;études (optionnel)
                    </FieldLabel>
                    <View style={s.chipsRow}>
                      {departments.map((d) => {
                        const selected = workDept === d.code;
                        return (
                          <Pressable
                            key={d.code}
                            onPress={() =>
                              setWorkDept(selected ? null : d.code)
                            }
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            style={[s.chip, selected && s.chipSelected]}
                          >
                            <Text
                              style={[
                                s.chipLabel,
                                selected && s.chipLabelSelected,
                              ]}
                            >
                              {d.code} – {d.name}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </>
              )}

              <StepActions onBack={goBack} onContinue={continueFromAddress} />
            </View>
          )}

          {step === "status" && (
            <View style={s.section}>
              <SectionTitle>Statut</SectionTitle>

              {age !== null && age >= 62 ? (
                <Text style={s.noteText}>
                  Le bénéficiaire a {age} ans : le statut Senior est attribué
                  automatiquement.
                </Text>
              ) : age !== null && age < 16 ? (
                <Text style={s.noteText}>
                  Le bénéficiaire a {age} ans : le statut Mineur est attribué
                  automatiquement.
                </Text>
              ) : (
                <Text style={s.noteText}>
                  Sélectionnez la situation actuelle. Le forfait recommandé
                  sera adapté en fonction du statut et de l&apos;âge.
                </Text>
              )}

              <View>
                <FieldLabel>Statut</FieldLabel>
                <View style={s.chipsRow}>
                  {STATUS_OPTIONS.filter((opt) => {
                    if (age !== null && age >= 62) return opt.value === "SENIOR";
                    if (age !== null && age < 16) return opt.value === "MINOR";
                    if (opt.value === "MINOR") return false;
                    if (opt.value === "SENIOR") return age === null || age >= 62;
                    if (opt.value === "STUDENT") return age === null || age <= 26;
                    return true;
                  }).map((opt) => {
                    const selected = status === opt.value;
                    const locked =
                      (age !== null && age >= 62) ||
                      (age !== null && age < 16);
                    return (
                      <Pressable
                        key={opt.value}
                        onPress={() => !locked && setStatus(opt.value)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          s.chip,
                          selected && s.chipSelected,
                          locked && selected && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[s.chipLabel, selected && s.chipLabelSelected]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!!errors.status && (
                  <Text style={s.fieldError}>{errors.status}</Text>
                )}
              </View>

              {status === "DISABLED" && (
                <Input
                  label="Numéro de sécurité sociale"
                  placeholder="1 23 45 67 890 123"
                  value={ssn}
                  onChangeText={setSsn}
                  error={errors.ssn}
                  keyboardType="number-pad"
                />
              )}

              <StepActions onBack={goBack} onContinue={continueFromStatus} />
            </View>
          )}

          {step === "reduction-proof" && recommendation.reduction && (
            <View style={s.section}>
              <SectionTitle>Justificatif de réduction</SectionTitle>
              <Text style={s.sectionLead}>
                Votre statut vous donne potentiellement accès à{" "}
                {recommendation.reduction.isFree
                  ? "la gratuité"
                  : recommendation.reduction.reductionPercent
                    ? `une réduction de ${recommendation.reduction.reductionPercent} %`
                    : "une réduction"}{" "}
                sur {recommendation.recommended?.name} (
                {recommendation.reduction.name}). Vous pouvez transmettre un
                justificatif maintenant pour accélérer la vérification, ou
                continuer sans et le déclarer sur l&apos;honneur (simulation :
                aucun document réel n&apos;est analysé).
              </Text>

              <Card style={s.scanCard}>
                <View
                  style={[s.scanIcon, proofState === "done" && s.scanIconDone]}
                >
                  <Icon
                    name={proofState === "done" ? "check" : "upload"}
                    size={26}
                    color={proofState === "done" ? DS.white : DS.actionPrimary}
                  />
                </View>

                {proofState === "idle" && (
                  <>
                    <Text style={s.scanText}>
                      Aucun justificatif transmis pour le moment.
                    </Text>
                    <View style={s.scanActionsRow}>
                      <Button leadingIcon="upload" onPress={pickReductionProof}>
                        Importer un justificatif
                      </Button>
                    </View>
                    <Pressable
                      onPress={skipReductionProof}
                      style={s.skipScanLink}
                    >
                      <Text style={s.skipScanLinkText}>
                        Continuer sans justificatif — je déclare mon éligibilité
                        sur l&apos;honneur
                      </Text>
                    </Pressable>
                  </>
                )}

                {proofState === "uploading" && (
                  <View style={s.inlineLoading}>
                    <ActivityIndicator color={DS.actionPrimary} />
                    <Text style={s.noteText}>
                      Analyse du justificatif en cours…
                    </Text>
                  </View>
                )}

                {proofState === "done" && (
                  <Text style={s.scanText}>
                    Justificatif transmis : {proofDocumentName}
                  </Text>
                )}
              </Card>

              {proofState === "done" ? (
                <StepActions
                  onBack={goBack}
                  onContinue={continueFromReductionProof}
                />
              ) : (
                <Button
                  variant="secondary"
                  leadingIcon="arrow-left"
                  disabled={proofState === "uploading"}
                  onPress={goBack}
                >
                  Précédent
                </Button>
              )}
            </View>
          )}

          {step === "plan" && (
            <View style={s.section}>
              <SectionTitle>Formule</SectionTitle>

              {tariffsLoading && (
                <View style={s.inlineLoading}>
                  <ActivityIndicator color={DS.actionPrimary} />
                  <Text style={s.noteText}>Chargement des formules…</Text>
                </View>
              )}

              {!tariffsLoading && tariffsError && (
                <View style={s.inlineError}>
                  <Icon name="alert-triangle" size={16} color={DS.dangerText} />
                  <Text style={s.inlineErrorText}>{tariffsError}</Text>
                  <Button size="sm" variant="secondary" onPress={reloadTariffs}>
                    Réessayer
                  </Button>
                </View>
              )}

              {!tariffsLoading && !tariffsError && tariffs.length === 0 && (
                <Text style={s.noteText}>
                  Aucune formule longue durée disponible pour le moment.
                </Text>
              )}

              {!tariffsLoading &&
                !tariffsError &&
                recommendation.recommended && (
                  <View style={s.section}>
                    <View style={s.recommendedBadgeRow}>
                      <Icon name="star" size={14} color={DS.actionPrimary} />
                      <Text style={s.recommendedBadgeText}>
                        Recommandé pour vous
                        {recommendation.reason
                          ? ` — ${recommendation.reason}`
                          : ""}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setPlanId(recommendation.recommended!.id)}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: planId === recommendation.recommended.id,
                      }}
                    >
                      <Card
                        style={[
                          s.planCard,
                          s.planCardRecommended,
                          planId === recommendation.recommended.id &&
                            s.planCardSelected,
                        ]}
                      >
                        <View style={s.planRow}>
                          <View
                            style={[
                              s.planRadio,
                              planId === recommendation.recommended.id &&
                                s.planRadioSelected,
                            ]}
                          >
                            {planId === recommendation.recommended.id && (
                              <View style={s.planRadioDot} />
                            )}
                          </View>
                          <View style={s.planText}>
                            <Text style={s.planLabel}>
                              {recommendation.recommended.name}
                            </Text>
                            {!!recommendation.recommended.description && (
                              <Text style={s.planDesc}>
                                {recommendation.recommended.description}
                              </Text>
                            )}
                            {recommendation.recommended.sellingArguments.map(
                              (arg) => (
                                <Text key={arg} style={s.sellingArgItem}>
                                  • {arg}
                                </Text>
                              ),
                            )}
                          </View>
                          <View style={s.planPriceCol}>
                            {proofSource && recommendation.reduction ? (
                              <>
                                <Text style={s.planPriceStrike}>
                                  {formatTariffPrice(
                                    recommendation.recommended,
                                  )}
                                </Text>
                                <Text style={s.planPrice}>
                                  {formatTariffPriceWithReduction(
                                    recommendation.recommended,
                                    recommendation.reduction,
                                  )}
                                </Text>
                              </>
                            ) : (
                              <Text style={s.planPrice}>
                                {formatTariffPrice(recommendation.recommended)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </Card>
                    </Pressable>

                    {recommendation.reduction && proofSource ? (
                      <View style={s.infoBanner}>
                        <Icon name="check" size={16} color={DS.infoText} />
                        <Text style={s.infoBannerText}>
                          Réduction appliquée : {recommendation.reduction.name}
                          {proofSource === "MANUAL_DOCUMENT"
                            ? ` — justificatif transmis (${proofDocumentName ?? "document"}).`
                            : " — déclarée sur l'honneur, sans justificatif transmis."}
                        </Text>
                      </View>
                    ) : (
                      !!recommendation.advisory && (
                        <View style={s.infoBanner}>
                          <Icon name="info" size={16} color={DS.infoText} />
                          <Text style={s.infoBannerText}>
                            {recommendation.advisory}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                )}

              {!tariffsLoading && !tariffsError && tariffs.length > 0 && (
                <>
                  {!showAllPlans ? (
                    <Button
                      variant="tertiary"
                      size="sm"
                      leadingIcon="chevron-down"
                      style={s.regenerateBtn}
                      onPress={() => setShowAllPlans(true)}
                    >
                      Voir les autres formules
                    </Button>
                  ) : (
                    tariffs
                      .filter((t) => t.id !== recommendation.recommended?.id)
                      .map((t) => {
                        const selected = planId === t.id;
                        const heldSub = heldLongPlans.get(t.id);
                        const held = Boolean(heldSub);
                        return (
                          <Pressable
                            key={t.id}
                            onPress={() => {
                              if (!held) setPlanId(t.id);
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ selected, disabled: held }}
                          >
                            <Card
                              style={[
                                s.planCard,
                                selected && s.planCardSelected,
                                held && s.planCardHeld,
                              ]}
                            >
                              <View style={s.planRow}>
                                <View
                                  style={[
                                    s.planRadio,
                                    selected && s.planRadioSelected,
                                  ]}
                                >
                                  {selected && <View style={s.planRadioDot} />}
                                </View>
                                <View style={s.planText}>
                                  <Text style={s.planLabel}>{t.name}</Text>
                                  {!!t.description && (
                                    <Text style={s.planDesc}>
                                      {t.description}
                                    </Text>
                                  )}
                                  {held && heldSub && (
                                    <Text style={s.planHeldNote}>
                                      Vous avez déjà cet abonnement — actif
                                      jusqu&apos;au{" "}
                                      {formatFrDate(new Date(heldSub.endDate))}
                                    </Text>
                                  )}
                                </View>
                                <Text style={s.planPrice}>
                                  {formatTariffPrice(t)}
                                </Text>
                              </View>
                            </Card>
                          </Pressable>
                        );
                      })
                  )}
                </>
              )}

              {!!errors.plan && <Text style={s.fieldError}>{errors.plan}</Text>}

              <Input
                label="Date de début souhaitée"
                placeholder="JJ/MM/AAAA"
                value={startDate}
                onChangeText={setStartDate}
                error={errors.startDate}
              />

              <StepActions onBack={goBack} onContinue={continueFromPlan} />
            </View>
          )}

          {step === "review" && selectedPlan && (
            <View style={s.section}>
              <SectionTitle>Récapitulatif</SectionTitle>

              <Card style={s.recapCard}>
                <RecapRow label="Titulaire" value={beneficiaryLabel} />
                <RecapRow label="Email" value={email || "—"} />
                {!!phone && <RecapRow label="Téléphone" value={phone} />}
                <RecapRow label="Statut" value={statusLabel ?? "—"} />
                <RecapRow
                  label="Résidence"
                  value={
                    residenceDeptLabel
                      ? `${residenceDeptLabel.code} – ${residenceDeptLabel.name}`
                      : "—"
                  }
                />
                {workDeptLabel && (
                  <RecapRow
                    label="Travail / études"
                    value={`${workDeptLabel.code} – ${workDeptLabel.name}`}
                  />
                )}
                <RecapRow label="Formule" value={selectedPlan.name} />
                <RecapRow
                  label="Tarif"
                  value={formatTariffPrice(selectedPlan)}
                />
                <RecapRow
                  label="Validité"
                  value={
                    endDateLabel
                      ? `Du ${startDate} au ${endDateLabel}`
                      : `À partir du ${startDate}`
                  }
                  last
                />
              </Card>

              {target === "other" && (
                <View style={s.infoBanner}>
                  <Icon name="info" size={16} color={DS.infoText} />
                  <Text style={s.infoBannerText}>
                    Vous serez désigné·e référent·e et payeur·se de cet
                    abonnement ; {beneficiaryLabel} en sera titulaire.
                  </Text>
                </View>
              )}

              {!!submitError && (
                <View style={s.inlineError}>
                  <Icon name="alert-triangle" size={16} color={DS.dangerText} />
                  <Text style={s.inlineErrorText}>{submitError}</Text>
                </View>
              )}

              <StepActions
                onBack={goBack}
                onContinue={goNext}
                continueLabel="Passer au paiement"
                continueIcon="arrow-right"
              />
            </View>
          )}

          {step === "payment" && (
            <View style={s.section}>
              <SectionTitle>Paiement</SectionTitle>
              <Text style={s.sectionLead}>
                Choisissez votre mode de paiement et renseignez vos coordonnées
                bancaires.
              </Text>

              <View>
                <FieldLabel>Mode de paiement</FieldLabel>
                <View style={s.paymentChoices}>
                  <Pressable
                    onPress={() => setPaymentMode("CARD_ONCE")}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: paymentMode === "CARD_ONCE",
                    }}
                  >
                    <Card
                      style={[
                        s.paymentChoice,
                        paymentMode === "CARD_ONCE" && s.paymentChoiceSelected,
                      ]}
                    >
                      <View style={s.paymentChoiceRow}>
                        <View
                          style={[
                            s.planRadio,
                            paymentMode === "CARD_ONCE" && s.planRadioSelected,
                          ]}
                        >
                          {paymentMode === "CARD_ONCE" && (
                            <View style={s.planRadioDot} />
                          )}
                        </View>
                        <View style={s.paymentChoiceIcon}>
                          <Icon
                            name="creditcard"
                            size={20}
                            color={
                              paymentMode === "CARD_ONCE"
                                ? DS.actionPrimary
                                : DS.textMuted
                            }
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.paymentChoiceLabel,
                              paymentMode === "CARD_ONCE" &&
                                s.paymentChoiceLabelSelected,
                            ]}
                          >
                            Carte bancaire
                          </Text>
                          <Text style={s.paymentChoiceDesc}>
                            Paiement annuel en une fois par carte ({selectedPlan ? `${((selectedPlan.priceCents ?? 0) / 100 * 12).toFixed(2).replace(".", ",")} €` : "—"})
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </Pressable>

                  <Pressable
                    onPress={() => setPaymentMode("SEPA_ONCE")}
                    accessibilityRole="button"
                    accessibilityState={{
                      selected: paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY",
                    }}
                  >
                    <Card
                      style={[
                        s.paymentChoice,
                        (paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY") &&
                          s.paymentChoiceSelected,
                      ]}
                    >
                      <View style={s.paymentChoiceRow}>
                        <View
                          style={[
                            s.planRadio,
                            (paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY") &&
                              s.planRadioSelected,
                          ]}
                        >
                          {(paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY") && (
                            <View style={s.planRadioDot} />
                          )}
                        </View>
                        <View style={s.paymentChoiceIcon}>
                          <Icon
                            name="receipt"
                            size={20}
                            color={
                              paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY"
                                ? DS.actionPrimary
                                : DS.textMuted
                            }
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              s.paymentChoiceLabel,
                              (paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY") &&
                                s.paymentChoiceLabelSelected,
                            ]}
                          >
                            Prélèvement SEPA
                          </Text>
                          <Text style={s.paymentChoiceDesc}>
                            Prélèvement bancaire par IBAN
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                </View>
                {!!errors.paymentMode && (
                  <Text style={s.fieldError}>{errors.paymentMode}</Text>
                )}
              </View>

              {paymentMode === "CARD_ONCE" && (
                <View style={s.infoBanner}>
                  <Icon name="lock" size={16} color={DS.infoText} />
                  <Text style={s.infoBannerText}>
                    Vous serez redirigé·e vers notre partenaire Stripe pour
                    saisir vos informations de carte bancaire en toute sécurité.
                  </Text>
                </View>
              )}

              {(paymentMode === "SEPA_ONCE" || paymentMode === "SEPA_MONTHLY") && (
                <View style={s.section}>
                  <FieldLabel>Fréquence de prélèvement</FieldLabel>
                  <View style={s.paymentChoices}>
                    <Pressable
                      onPress={() => setPaymentMode("SEPA_ONCE")}
                      accessibilityRole="button"
                    >
                      <Card
                        style={[
                          s.paymentChoice,
                          paymentMode === "SEPA_ONCE" && s.paymentChoiceSelected,
                        ]}
                      >
                        <View style={s.paymentChoiceRow}>
                          <View
                            style={[
                              s.planRadio,
                              paymentMode === "SEPA_ONCE" && s.planRadioSelected,
                            ]}
                          >
                            {paymentMode === "SEPA_ONCE" && (
                              <View style={s.planRadioDot} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.paymentChoiceLabel,
                                paymentMode === "SEPA_ONCE" &&
                                  s.paymentChoiceLabelSelected,
                              ]}
                            >
                              En une fois
                            </Text>
                            <Text style={s.paymentChoiceDesc}>
                              {selectedPlan ? `${((selectedPlan.priceCents ?? 0) / 100 * 12).toFixed(2).replace(".", ",")} € prélevés en une fois` : "—"}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>

                    <Pressable
                      onPress={() => setPaymentMode("SEPA_MONTHLY")}
                      accessibilityRole="button"
                    >
                      <Card
                        style={[
                          s.paymentChoice,
                          paymentMode === "SEPA_MONTHLY" && s.paymentChoiceSelected,
                        ]}
                      >
                        <View style={s.paymentChoiceRow}>
                          <View
                            style={[
                              s.planRadio,
                              paymentMode === "SEPA_MONTHLY" && s.planRadioSelected,
                            ]}
                          >
                            {paymentMode === "SEPA_MONTHLY" && (
                              <View style={s.planRadioDot} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                s.paymentChoiceLabel,
                                paymentMode === "SEPA_MONTHLY" &&
                                  s.paymentChoiceLabelSelected,
                              ]}
                            >
                              Mensuel
                            </Text>
                            <Text style={s.paymentChoiceDesc}>
                              {selectedPlan ? `${((selectedPlan.priceCents ?? 0) / 100).toFixed(2).replace(".", ",")} € / mois pendant 12 mois` : "—"}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </Pressable>
                  </View>

                  <FieldLabel>Coordonnées bancaires (RIB)</FieldLabel>

                  <Input
                    label="IBAN"
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    value={iban}
                    onChangeText={setIban}
                    error={errors.iban}
                    autoCapitalize="characters"
                  />

                  <Input
                    label="BIC"
                    placeholder="BNPAFRPP"
                    value={bic}
                    onChangeText={setBic}
                    autoCapitalize="characters"
                  />

                  <Input
                    label="Titulaire du compte"
                    placeholder="Nom et prénom du titulaire"
                    value={holderName}
                    onChangeText={setHolderName}
                    error={errors.holderName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              {!!submitError && (
                <View style={s.inlineError}>
                  <Icon name="alert-triangle" size={16} color={DS.dangerText} />
                  <Text style={s.inlineErrorText}>{submitError}</Text>
                </View>
              )}

              <StepActions
                onBack={goBack}
                onContinue={confirm}
                continueLabel={
                  submitting
                    ? "Envoi en cours…"
                    : paymentMode === "CARD_ONCE"
                      ? "Payer par carte"
                      : "Valider et payer"
                }
                continueIcon={
                  submitting
                    ? undefined
                    : paymentMode === "CARD_ONCE"
                      ? "link"
                      : "check"
                }
                disabled={submitting || !paymentMode}
              />
              {submitting && <ActivityIndicator color={DS.actionPrimary} />}
            </View>
          )}

          {step === "success" && (
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <Icon name="check" size={28} color={DS.white} />
              </View>
              <Text style={s.successTitle}>Demande envoyée</Text>
              <Text style={s.successDesc}>
                Votre demande d&apos;abonnement {selectedPlan?.name} pour{" "}
                {beneficiaryLabel} a bien été enregistrée.
              </Text>
              <Button fullWidth onPress={() => router.replace("/dashboard")}>
                Retour à mon espace
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DS.surfacePage },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DS.space5,
    paddingTop: DS.space4,
    paddingBottom: DS.space8,
    alignItems: "center",
  },
  wrapper: {
    width: "100%",
    maxWidth: 640,
    gap: DS.space5,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: DS.radiusPill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.surfaceCard,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: DS.textStrong,
  },
  stepIndicator: {
    fontSize: 13,
    color: DS.textMuted,
    marginTop: 2,
  },

  section: {
    gap: DS.space4,
  },
  sectionLead: {
    fontSize: 15,
    color: DS.textMuted,
  },
  stepActions: {
    flexDirection: "row",
    gap: DS.space3,
  },
  stepActionBtn: {
    flex: 1,
  },
  noteText: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 18,
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: DS.space2,
    backgroundColor: DS.dangerTint,
    borderRadius: DS.radiusSm,
    padding: DS.space3,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 13,
    color: DS.dangerText,
    minWidth: 160,
  },

  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space4,
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfaceSelected,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  choiceText: { flex: 1, gap: 2 },
  choiceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: DS.textStrong,
  },
  choiceDesc: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 18,
  },

  scanCard: {
    alignItems: "center",
    gap: DS.space3,
    paddingVertical: DS.space5,
  },
  scanIcon: {
    width: 56,
    height: 56,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.surfaceSelected,
    alignItems: "center",
    justifyContent: "center",
  },
  scanIconDone: {
    backgroundColor: DS.success,
  },
  scanText: {
    fontSize: 14,
    color: DS.textMuted,
    textAlign: "center",
  },
  scanActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: DS.space3,
  },
  skipScanLink: {
    alignSelf: "center",
    marginTop: DS.space2,
  },
  skipScanLinkText: {
    fontSize: 13,
    color: DS.textMuted,
    textDecorationLine: "underline",
    textAlign: "center",
  },
  regenerateBtn: {
    alignSelf: "flex-start",
    marginTop: DS.space2,
  },

  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space4,
  },
  formCol: { flex: 1, minWidth: 160 },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    marginBottom: DS.space2,
  },
  fieldError: {
    fontSize: 13,
    color: DS.dangerText,
    fontWeight: "500",
    marginTop: DS.space1,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DS.space2,
  },
  chip: {
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
    borderRadius: DS.radiusPill,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: DS.surfaceCard,
  },
  chipSelected: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.bluePale,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
  },
  chipLabelSelected: {
    color: DS.actionPrimary,
  },

  planCard: {
    marginBottom: DS.space3,
  },
  planCardRecommended: {
    borderColor: DS.actionPrimary,
    borderWidth: 1.5,
  },
  planCardSelected: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.bluePale,
  },
  planCardHeld: {
    opacity: 0.55,
  },
  planHeldNote: {
    fontSize: 12,
    color: DS.dangerText,
    marginTop: 4,
  },
  recommendedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  recommendedBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.actionPrimary,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: DS.radiusPill,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planRadioSelected: {
    borderColor: DS.actionPrimary,
  },
  planRadioDot: {
    width: 12,
    height: 12,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
  },
  planText: { flex: 1, gap: 2 },
  planLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  planDesc: {
    fontSize: 13,
    color: DS.textMuted,
    lineHeight: 18,
  },
  sellingArgItem: {
    fontSize: 13,
    color: DS.textMuted,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.textStrong,
  },
  planPriceCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  planPriceStrike: {
    fontSize: 12,
    color: DS.textMuted,
    textDecorationLine: "line-through",
  },

  recapCard: { gap: 0 },
  recapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: DS.space3,
    gap: DS.space3,
  },
  recapRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
  },
  recapLabel: {
    fontSize: 14,
    color: DS.textMuted,
  },
  recapValue: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
    flexShrink: 1,
    textAlign: "right",
  },

  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    backgroundColor: DS.infoTint,
    borderRadius: DS.radiusSm,
    padding: DS.space3,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: DS.infoText,
  },

  paymentChoices: {
    gap: DS.space3,
  },
  paymentChoice: {
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
  },
  paymentChoiceSelected: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.bluePale,
  },
  paymentChoiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  paymentChoiceIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.surfaceSelected,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  paymentChoiceLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  paymentChoiceLabelSelected: {
    color: DS.actionPrimary,
  },
  paymentChoiceDesc: {
    fontSize: 13,
    color: DS.textMuted,
  },

  successWrap: {
    alignItems: "center",
    gap: DS.space3,
    paddingVertical: DS.space7,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DS.space2,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: DS.textStrong,
  },
  successDesc: {
    fontSize: 14,
    color: DS.textMuted,
    textAlign: "center",
    marginBottom: DS.space4,
  },
});
