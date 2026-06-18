import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useDepartments } from "@/hooks/useDepartments";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import type { ApiSubscription } from "@/hooks/use-subscriptions";
import { useTariffs } from "@/hooks/useTariffs";
import {
  beneficiariesApi,
  Beneficiary,
  BeneficiaryStatus,
} from "@/lib/api/beneficiaries";
import { recommendTariff } from "@/lib/recommendTariff";
import { statusVerificationsApi } from "@/lib/api/statusVerification";
import { subscriptionsApi } from "@/lib/api/subscriptions";
import type { PaymentMode } from "@/lib/api/subscriptions";
import { useFetch } from "@/hooks/useFetch";
import { createBankInfo } from "@/lib/api/bank-info";
import { createSubscriptionCheckout } from "@/lib/api/billing";
import type { AuthUser } from "@/lib/api/auth";
import {
  computeAge,
  pickRandomStatus,
  todayFr,
} from "@/components/subscription/new/helpers";
import {
  FALLBACK_SCAN_NAME,
  MOCK_SCAN_BIRTHDATE,
  PLAN_DURATION_MONTHS,
  SIMULATED_BIRTHDATE_FC,
  SIMULATED_RESIDENCE_CODE,
  SIMULATED_WORK_CODE,
  STATUS_OPTIONS,
  Step,
  STEP_FLOW,
  Target,
} from "@/components/subscription/new/types";
import {
  addMonths,
  formatFrDate,
  parseFrDate,
} from "@/lib/subscription-helpers";
import { ApiError, http } from "@/services/api";
import { StepProfile } from "@/components/subscription/new/StepProfile";
import { StepAddress } from "@/components/subscription/new/StepAddress";
import { StepStatus } from "@/components/subscription/new/StepStatus";
import { StepReductionProof } from "@/components/subscription/new/StepReductionProof";
import { StepReview } from "@/components/subscription/new/StepReview";
import { StepPayment } from "@/components/subscription/new/StepPayment";
import { StepSuccess } from "@/components/subscription/new/StepSuccess";
import { StepScan } from "@/components/subscription/new/StepScan";
import { StepTarget } from "@/components/subscription/new/StepTarget";
import { s } from "@/components/subscription/new/styles";
import { StepPlan } from "@/components/subscription/new/StepPlan";

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
  const { data: beneficiaries, loading: myBeneficiariesLoading } =
    useFetch<Beneficiary[]>("/beneficiaries");

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

  const myBeneficiary = useMemo(
    () => beneficiaries?.find((b) => b.accountTitulaireId === user?.id) ?? null,
    [beneficiaries, user?.id],
  );
  const hasIdentity = Boolean(
    myBeneficiary || (user?.firstName?.trim() && user?.lastName?.trim()),
  );

  const [target, setTarget] = useState<Target | null>(initialTarget);
  const showScan = target !== null && !(target === "self" && hasIdentity);

  const [status, setStatus] = useState<BeneficiaryStatus | null>(null);
  const [birthDate, setBirthDate] = useState("");

  const age = useMemo(() => computeAge(birthDate), [birthDate]);

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

  const [proofState, setProofState] = useState<"idle" | "uploading" | "done">(
    "idle",
  );
  const [proofSource, setProofSource] = useState<
    "MANUAL_DOCUMENT" | "DECLARATIVE" | null
  >(null);
  const [proofDocumentName, setProofDocumentName] = useState<string | null>(
    null,
  );

  const [firstName, setFirstName] = useState(() =>
    initialTarget === "self" ? (user?.firstName ?? "") : "",
  );
  const [lastName, setLastName] = useState(() =>
    initialTarget === "self" ? (user?.lastName ?? "") : "",
  );

  const [ssn, setSsn] = useState("");
  const [residenceDept, setResidenceDept] = useState<string | null>(null);
  const [workDept, setWorkDept] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [planId, setPlanId] = useState<number | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [startDate, setStartDate] = useState(todayFr);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingBeneficiaryId, setExistingBeneficiaryId] = useState<
    number | null
  >(null);

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

  function applyBeneficiaryData(b: Beneficiary) {
    setFirstName(b.firstName);
    setLastName(b.lastName);
    setBirthDate(formatFrDate(new Date(b.birthDate)));
    setSsn(b.socialSecurityNumber ?? "");
    setStatus(b.status);
    setResidenceDept(
      departments.find((d) => d.id === b.residenceDepartmentId)?.code ?? null,
    );
    setWorkDept(
      departments.find((d) => d.id === b.workStudyDepartmentId)?.code ?? null,
    );
    setExistingBeneficiaryId(b.id);
    setScanState("done");
  }

  function selectExistingBeneficiary(b: Beneficiary) {
    setFirstName(b.firstName);
    setLastName(b.lastName);
    setBirthDate(formatFrDate(new Date(b.birthDate)));
    setSsn(b.socialSecurityNumber ?? "");
    setStatus(b.status);
    setResidenceDept(
      departments.find((d) => d.id === b.residenceDepartmentId)?.code ?? null,
    );
    setWorkDept(
      departments.find((d) => d.id === b.workStudyDepartmentId)?.code ?? null,
    );
    setScanState("done");
    goNext();
  }

  function selectTarget(t: Target) {
    setTarget(t);

    if (t === "self") {
      if (myBeneficiary) {
        applyBeneficiaryData(myBeneficiary);
        setStep("profile");
        return;
      }
      if (hasIdentity) {
        setFirstName(user?.firstName ?? "");
        setLastName(user?.lastName ?? "");
        setBirthDate(SIMULATED_BIRTHDATE_FC);
        simulateGovernmentLookup(SIMULATED_BIRTHDATE_FC);
        setStep("profile");
        return;
      }
    }

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
    setStatus(pickRandomStatus());
  }

  function runScanSimulation() {
    setScanState("scanning");
    setTimeout(() => {
      const result = {
        firstName: FALLBACK_SCAN_NAME.firstName,
        lastName: FALLBACK_SCAN_NAME.lastName,
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
    if (initialTarget !== "self") return;
    if (myBeneficiary) {
      applyBeneficiaryData(myBeneficiary);
      return;
    }
    if (hasIdentity) {
      setBirthDate(SIMULATED_BIRTHDATE_FC);
      simulateGovernmentLookup(SIMULATED_BIRTHDATE_FC);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTarget, myBeneficiary, hasIdentity]);

  function validateProfile(): boolean {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = "Le prénom est requis.";
    if (!lastName.trim()) next.lastName = "Le nom est requis.";
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
    if (!residenceDept)
      next.residenceDept = "Le département de résidence est requis.";
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

      if (existingBeneficiaryId) {
        beneficiaryId = existingBeneficiaryId;
      } else if (target === "self" && user?.beneficiaryId) {
        beneficiaryId = user.beneficiaryId;
      } else {
        try {
          const beneficiary = await beneficiariesApi.create({
            firstName,
            lastName,
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

      const isSepa =
        paymentMode === "SEPA_MONTHLY" || paymentMode === "SEPA_ONCE";

      const bankInfo = await createBankInfo({
        accountId: user!.id,
        iban: isSepa ? iban.replace(/\s/g, "") : "FR7600000000000000000000000",
        bic: isSepa && bic.trim() ? bic.trim() : undefined,
        holderName: isSepa
          ? holderName.trim()
          : [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "CB",
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

  const otherBeneficiaries =
    beneficiaries?.filter((b) => b.accountTitulaireId !== user?.id) ?? [];

  return (
    <View>
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

      {step === "target" && <StepTarget onSelect={selectTarget} />}

      {step === "scan" && (
        <StepScan
          target={target}
          scanState={scanState}
          firstName={firstName}
          lastName={lastName}
          birthDate={birthDate}
          otherBeneficiaries={otherBeneficiaries}
          otherBeneficiariesLoading={myBeneficiariesLoading}
          onSelectExisting={selectExistingBeneficiary}
          onScan={runScanSimulation}
          onPickDocument={pickDocument}
          onSkip={skipScan}
          onContinue={continueFromScan}
          onBack={goBack}
        />
      )}

      {step === "profile" && (
        <StepProfile
          target={target}
          hasIdentity={hasIdentity}
          showScan={showScan}
          scanDone={scanState === "done"}
          firstName={firstName}
          lastName={lastName}
          birthDate={birthDate}
          errors={errors}
          onFirstNameChange={setFirstName}
          onLastNameChange={setLastName}
          onBirthDateChange={setBirthDate}
          onBack={goBack}
          onContinue={continueFromProfile}
        />
      )}

      {step === "address" && (
        <StepAddress
          departments={departments}
          departmentsLoading={departmentsLoading}
          departmentsError={departmentsError}
          onReloadDepartments={reloadDepartments}
          residenceDept={residenceDept}
          workDept={workDept}
          errors={errors}
          onResidenceDeptChange={setResidenceDept}
          onWorkDeptChange={setWorkDept}
          onBack={goBack}
          onContinue={continueFromAddress}
        />
      )}

      {step === "status" && (
        <StepStatus
          age={age}
          status={status}
          ssn={ssn}
          errors={errors}
          onStatusChange={setStatus}
          onSsnChange={setSsn}
          onBack={goBack}
          onContinue={continueFromStatus}
        />
      )}

      {step === "reduction-proof" && recommendation.reduction && (
        <StepReductionProof
          recommended={recommendation.recommended}
          reduction={recommendation.reduction}
          proofState={proofState}
          proofDocumentName={proofDocumentName}
          onPickProof={pickReductionProof}
          onSkip={skipReductionProof}
          onContinue={continueFromReductionProof}
          onBack={goBack}
        />
      )}

      {step === "plan" && (
        <StepPlan
          tariffs={tariffs}
          tariffsLoading={tariffsLoading}
          tariffsError={tariffsError}
          onReloadTariffs={reloadTariffs}
          recommended={recommendation.recommended}
          reduction={recommendation.reduction}
          reason={recommendation.reason}
          advisory={recommendation.advisory}
          proofSource={proofSource}
          proofDocumentName={proofDocumentName}
          planId={planId}
          onPlanIdChange={setPlanId}
          showAllPlans={showAllPlans}
          onShowAllPlans={() => setShowAllPlans(true)}
          heldLongPlans={heldLongPlans}
          startDate={startDate}
          onStartDateChange={setStartDate}
          errors={errors}
          onBack={goBack}
          onContinue={continueFromPlan}
        />
      )}

      {step === "review" && selectedPlan && (
        <StepReview
          target={target}
          beneficiaryLabel={beneficiaryLabel}
          statusLabel={statusLabel}
          residenceDeptLabel={residenceDeptLabel}
          workDeptLabel={workDeptLabel}
          selectedPlan={selectedPlan}
          startDate={startDate}
          endDateLabel={endDateLabel}
          submitError={submitError}
          onBack={goBack}
          onContinue={goNext}
        />
      )}

      {step === "payment" && (
        <StepPayment
          selectedPlan={selectedPlan}
          paymentMode={paymentMode}
          onPaymentModeChange={setPaymentMode}
          iban={iban}
          onIbanChange={setIban}
          bic={bic}
          onBicChange={setBic}
          holderName={holderName}
          onHolderNameChange={setHolderName}
          errors={errors}
          submitError={submitError}
          submitting={submitting}
          onBack={goBack}
          onConfirm={confirm}
        />
      )}

      {step === "success" && (
        <StepSuccess
          planName={selectedPlan?.name}
          beneficiaryLabel={beneficiaryLabel}
          onBackToDashboard={() => router.replace("/dashboard")}
        />
      )}
    </View>
  );
}
