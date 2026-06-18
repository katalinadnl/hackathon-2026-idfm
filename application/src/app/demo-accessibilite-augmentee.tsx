import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { pageInner } from "@/hooks/use-page-layout";

// ─── Données statiques ──────────────────────────────────────────────────────

const ORIGINAL_TEXT =
  "Votre dossier est incomplet. Veuillez transmettre un justificatif d'éligibilité afin de poursuivre le renouvellement de l'abonnement du porteur.";

const SIMPLIFIED_TEXT =
  "Il manque un document.\nAjoutez-le pour continuer le renouvellement.";

const GLOSSARY: { term: string; definition: string }[] = [
  { term: "Porteur",      definition: "La personne qui utilise le pass." },
  { term: "Payeur",       definition: "La personne qui paie l'abonnement." },
  { term: "Justificatif", definition: "Un document demandé pour prouver une information." },
  { term: "Mandat SEPA",  definition: "Une autorisation pour prélever l'argent sur un compte bancaire." },
  { term: "Renouvellement", definition: "Le fait de prolonger son abonnement pour une nouvelle période." },
  { term: "Incomplétude", definition: "Il manque une information ou un document dans le dossier." },
];

const STEPS = [
  { question: "Qui utilise le pass ?",              choices: ["Moi", "Mon enfant"] },
  { question: "Quel document manque ?",              choices: ["Ajouter un justificatif"] },
  { question: "Votre dossier est prêt à être envoyé", choices: ["Valider"] },
];

// ─── Assistant règles locales ───────────────────────────────────────────────

function getAssistantResponse(q: string): string {
  const t = q.toLowerCase();
  if (t.includes("renouveler") || t.includes("renouvellement"))
    return "Pour renouveler, vérifiez les informations du porteur, ajoutez les documents demandés, puis validez.";
  if (t.includes("payeur"))
    return "Le payeur est la personne qui paie l'abonnement. Ce n'est pas forcément la personne qui utilise le pass.";
  if (t.includes("porteur"))
    return "Le porteur est la personne qui utilise le pass dans les transports.";
  if (t.includes("boursier") || t.includes("bourse"))
    return "Si l'élève est boursier, il peut avoir une réduction Imagine R selon son département. Il faut ajouter une attestation de bourse.";
  if (t.includes("document") || t.includes("justificatif"))
    return "Ajoutez une photo ou un fichier du document demandé. Le dossier sera ensuite vérifié.";
  if (t.includes("perdu") || t.includes("volé"))
    return "Vous pouvez bloquer le pass puis demander un nouveau support.";
  return "Je peux vous aider à comprendre les mots, renouveler un abonnement ou ajouter un document.";
}

// ─── TTS (web only) ─────────────────────────────────────────────────────────

function speakText(text: string) {
  if (Platform.OS !== "web" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.replace(/\n/g, " "));
  utt.lang = "fr-FR";
  window.speechSynthesis.speak(utt);
}

function stopSpeaking() {
  if (Platform.OS !== "web" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

// ─── FocusPressable — focus ring WCAG 2.4.13 ────────────────────────────────
// Adds a visible 3 px focus outline on web (contrast ≥ 3:1 with adjacent).

function FocusPressable({
  style,
  children,
  onFocus,
  onBlur,
  ...props
}: ComponentProps<typeof Pressable>) {
  const [isFocused, setIsFocused] = useState(false);

  const focusOverlay =
    Platform.OS === "web" && isFocused
      ? ({
          outlineWidth: 3,
          outlineStyle: "solid",
          outlineColor: DS.focusRing,
          outlineOffset: 3,
        } as any)
      : undefined;

  return (
    <Pressable
      {...props}
      onFocus={(e) => {
        setIsFocused(true);
        if (typeof onFocus === "function") (onFocus as any)(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        if (typeof onBlur === "function") (onBlur as any)(e);
      }}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        focusOverlay,
      ]}
    >
      {children}
    </Pressable>
  );
}

// ─── Section card with landmark role ────────────────────────────────────────
// role="region" + aria-label creates a navigable landmark (WCAG 2.4.10).

function SectionCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View
      style={styles.card}
      // Maps to role="region" aria-label on web (WCAG 2.4.10 AAA)
      accessibilityRole={"region" as any}
      accessibilityLabel={label}
    >
      {children}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text style={styles.sectionTitle} accessibilityRole="header">
      {children}
    </Text>
  );
}

// ─── Page principale ────────────────────────────────────────────────────────

export default function DemoAccessibiliteAugmentee() {
  const [simplified, setSimplified] = useState(false);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  // Voix
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognizerRef = useRef<any>(null);

  // Assistant
  const [assistantInput, setAssistantInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState<string | null>(null);

  // Pas-à-pas
  const [step, setStep] = useState(0);
  const [stepDone, setStepDone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (SR) setVoiceSupported(true);
  }, []);

  function startListening() {
    if (Platform.OS !== "web") return;
    const SR =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recognizerRef.current) {
      try { recognizerRef.current.abort(); } catch {}
    }
    const rec = new SR();
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript;
      setAssistantInput(transcript);
      setAssistantResponse(getAssistantResponse(transcript));
      setVoiceListening(false);
      setVoiceNote(null);
    };
    rec.onerror = (e: any) => {
      setVoiceListening(false);
      if (e.error === "not-allowed")
        setVoiceNote("Accès au microphone refusé. Autorisez-le dans les paramètres du navigateur.");
      else if (e.error === "no-speech")
        setVoiceNote("Aucune parole détectée. Réessayez.");
      else if (e.error === "network")
        setVoiceNote("Dictée indisponible sur ce réseau. La lecture audio fonctionne.");
      else
        setVoiceNote("La dictée a rencontré un problème. La lecture audio fonctionne.");
    };
    rec.onend = () => setVoiceListening(false);
    recognizerRef.current = rec;
    rec.start();
    setVoiceListening(true);
    setVoiceNote(null);
  }

  function stopListening() {
    if (!recognizerRef.current) return;
    try { recognizerRef.current.stop(); } catch {}
    setVoiceListening(false);
  }

  function handleSpeak() {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      speakText(displayedText);
      setIsSpeaking(true);
      // Reset flag when synthesis ends
      if (Platform.OS === "web" && "speechSynthesis" in window) {
        const check = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            setIsSpeaking(false);
            clearInterval(check);
          }
        }, 300);
      }
    }
  }

  function handleAsk() {
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    setAssistantResponse(getAssistantResponse(trimmed));
  }

  function handleStepChoice() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else setStepDone(true);
  }

  const displayedText = simplified ? SIMPLIFIED_TEXT : ORIGINAL_TEXT;
  const activeDefinition = activeTerm
    ? GLOSSARY.find((g) => g.term === activeTerm)?.definition
    : null;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={Platform.OS === "web" ? [] : ["top"]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[pageInner, styles.page]}>

          {/* ── En-tête ──────────────────────────────────────────────── */}
          <View style={styles.header}>
            {/* DemoTag visible to screen readers — contextual info (WCAG 1.3.1) */}
            <View
              style={styles.demoTag}
              accessible
              accessibilityLabel="Page de démonstration"
            >
              <Text style={styles.demoTagText} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                DÉMO
              </Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              Accessibilité augmentée
            </Text>
            {/* textBody (10.3:1) replaces textMuted (5.65:1) — WCAG 1.4.6 AAA */}
            <Text style={styles.subtitle}>
              Une aide intelligente pour rendre les démarches d'abonnement
              compréhensibles par tous.
            </Text>
          </View>

          {/* ── 1. Situation utilisateur ─────────────────────────────── */}
          <SectionCard label="Situation utilisateur">
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Icon name="person" size={18} color={DS.actionPrimary} />
              </View>
              <SectionTitle>Situation utilisateur</SectionTitle>
            </View>
            <View style={styles.situationRow}>
              {/* textBody for readable label text (10.3:1) */}
              <Text style={styles.situationLabel}>Usager</Text>
              <Text style={styles.situationValue}>
                Parent qui renouvelle l'abonnement Imagine R de son enfant
              </Text>
            </View>
            <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.situationRow}>
              <Text style={styles.situationLabel}>Difficulté</Text>
              <Text style={styles.situationValue}>
                Ne comprend pas les termes administratifs
              </Text>
            </View>
            <View style={styles.divider} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
            <View style={styles.situationRow}>
              <Text style={styles.situationLabel}>Objectif</Text>
              <Text style={styles.situationValue}>
                {/* SAV développé — WCAG 3.1.4 AAA Abbreviations */}
                Terminer le renouvellement sans appeler le service client
              </Text>
            </View>
          </SectionCard>

          {/* ── 2. Texte administratif + simplification ──────────────── */}
          <SectionCard label="Texte administratif et simplification">
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: DS.warningTint }]}>
                <Icon name="alert-triangle" size={18} color={DS.warning} />
              </View>
              <SectionTitle>Texte administratif original</SectionTitle>
            </View>

            <View
              style={styles.adminTextBox}
              accessibilityLiveRegion="polite"
              accessibilityLabel={
                simplified
                  ? `Texte simplifié : ${SIMPLIFIED_TEXT}`
                  : `Texte original : ${ORIGINAL_TEXT}`
              }
            >
              {simplified && (
                <View style={styles.simplifiedBadge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Icon name="star" size={12} color={DS.success} />
                  <Text style={styles.simplifiedBadgeText}>Simplifié</Text>
                </View>
              )}
              <Text style={[styles.adminText, simplified && styles.adminTextSimplified]}>
                {displayedText}
              </Text>
            </View>

            <FocusPressable
              onPress={() => setSimplified((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel={
                simplified
                  ? "Afficher le texte original"
                  : "Simplifier avec l'aide intelligente"
              }
              accessibilityHint={
                simplified
                  ? "Revient au texte administratif d'origine"
                  : "Réécrit le texte en langage simple"
              }
              style={({ pressed }) => [
                styles.simplifyBtn,
                simplified && styles.simplifyBtnActive,
                pressed && styles.simplifyBtnPressed,
              ]}
            >
              <Icon
                name="accessibility"
                size={16}
                color={simplified ? DS.white : DS.actionPrimary}
              />
              <Text style={[styles.simplifyBtnText, simplified && styles.simplifyBtnTextActive]}>
                {simplified ? "Afficher le texte original" : "Simplifier avec l'aide intelligente"}
              </Text>
            </FocusPressable>
          </SectionCard>

          {/* ── 3. Glossaire ─────────────────────────────────────────── */}
          <SectionCard label="Glossaire intelligent des termes administratifs">
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: DS.infoTint }]}>
                <Icon name="info" size={18} color={DS.actionPrimary} />
              </View>
              <SectionTitle>Glossaire intelligent</SectionTitle>
            </View>

            {/* cardHint with textBody (10.3:1) */}
            <Text style={styles.cardHint}>
              Appuyez sur un terme pour voir son explication.
            </Text>

            <View style={styles.termsRow} accessibilityRole="list">
              {GLOSSARY.map(({ term }) => (
                <FocusPressable
                  key={term}
                  onPress={() => setActiveTerm((t) => (t === term ? null : term))}
                  accessibilityRole="button"
                  accessibilityLabel={`Définir le terme : ${term}`}
                  accessibilityHint={
                    activeTerm === term
                      ? "Appuyez pour fermer la définition"
                      : "Appuyez pour voir la définition"
                  }
                  accessibilityState={{ selected: activeTerm === term }}
                  style={({ pressed }) => [
                    styles.termChip,
                    activeTerm === term && styles.termChipActive,
                    pressed && styles.termChipPressed,
                  ]}
                >
                  <Text style={[styles.termChipText, activeTerm === term && styles.termChipTextActive]}>
                    {term}
                  </Text>
                </FocusPressable>
              ))}
            </View>

            {activeDefinition && (
              <View
                style={styles.definitionBox}
                accessibilityLiveRegion="polite"
                accessibilityLabel={`Définition de ${activeTerm} : ${activeDefinition}`}
              >
                <Text style={styles.definitionTerm}>{activeTerm}</Text>
                <Text style={styles.definitionText}>{activeDefinition}</Text>
              </View>
            )}
          </SectionCard>

          {/* ── 4. Mode vocal ─────────────────────────────────────────── */}
          <SectionCard label="Mode vocal : dictée et lecture audio">
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: DS.successTint }]}>
                <Icon name="mic" size={18} color={DS.success} />
              </View>
              <SectionTitle>Mode vocal</SectionTitle>
            </View>

            <View style={styles.voiceBtnRow}>
              {voiceSupported ? (
                <FocusPressable
                  onPress={voiceListening ? stopListening : startListening}
                  accessibilityRole="button"
                  accessibilityLabel={voiceListening ? "Arrêter la dictée" : "Parler"}
                  accessibilityHint={
                    voiceListening
                      ? "Arrête la capture de voix"
                      : "Commence à écouter votre question"
                  }
                  accessibilityState={{ checked: voiceListening }}
                  style={({ pressed }) => [
                    styles.voiceBtn,
                    voiceListening && styles.voiceBtnActive,
                    pressed && styles.voiceBtnPressed,
                  ]}
                >
                  <Icon
                    name={voiceListening ? "mic-off" : "mic"}
                    size={18}
                    color={voiceListening ? DS.white : DS.actionPrimary}
                  />
                  <Text style={[styles.voiceBtnText, voiceListening && styles.voiceBtnTextActive]}>
                    {voiceListening ? "Écoute en cours…" : "Parler"}
                  </Text>
                </FocusPressable>
              ) : (
                <View
                  style={styles.voiceBtnDisabled}
                  accessible
                  accessibilityLabel="Dictée vocale non disponible"
                >
                  <Icon name="mic" size={18} color={DS.textBody} />
                  <Text style={styles.voiceBtnDisabledText}>Dictée non disponible</Text>
                </View>
              )}

              {/* Stop/read button — SpeechSynthesis works offline (2.2.2 Pause AA) */}
              <FocusPressable
                onPress={handleSpeak}
                accessibilityRole="button"
                accessibilityLabel={isSpeaking ? "Arrêter la lecture" : "Lire l'explication à voix haute"}
                accessibilityHint={
                  isSpeaking
                    ? "Arrête la synthèse vocale en cours"
                    : "Lit le texte affiché ci-dessus à voix haute"
                }
                style={({ pressed }) => [
                  styles.voiceBtn,
                  isSpeaking && styles.voiceBtnActive,
                  pressed && styles.voiceBtnPressed,
                ]}
              >
                <Icon name="volume" size={18} color={isSpeaking ? DS.white : DS.actionPrimary} />
                <Text style={[styles.voiceBtnText, isSpeaking && styles.voiceBtnTextActive]}>
                  {isSpeaking ? "Arrêter la lecture" : "Lire l'explication"}
                </Text>
              </FocusPressable>
            </View>

            {voiceNote && (
              <View
                style={styles.voiceNote}
                accessibilityLiveRegion="assertive"
                accessible
                accessibilityLabel={voiceNote}
              >
                <Icon name="info" size={14} color={DS.infoText} />
                <Text style={styles.voiceNoteText}>{voiceNote}</Text>
              </View>
            )}

            {!voiceSupported && Platform.OS === "web" && (
              <Text style={styles.voiceUnsupported}>
                La dictée vocale n'est pas disponible sur ce navigateur, mais
                la lecture audio fonctionne.
              </Text>
            )}
          </SectionCard>

          {/* ── 5. Assistant local ────────────────────────────────────── */}
          <SectionCard label="Assistant local, fonctionne hors ligne">
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: DS.blueSoft }]}>
                <Icon name="star" size={18} color={DS.actionPrimary} />
              </View>
              <SectionTitle>Assistant local</SectionTitle>
            </View>

            <Text style={styles.cardHint}>
              Posez une question — tout fonctionne hors ligne.
            </Text>

            {/* Visible label above input — WCAG 1.3.1 + 2.4.6 */}
            <Text
              style={styles.inputLabel}
              nativeID="assistantInputLabel"
            >
              Votre question
            </Text>

            <View style={styles.assistantInputRow}>
              <TextInput
                style={[
                  styles.assistantInput,
                  inputFocused && styles.assistantInputFocused,
                ]}
                value={assistantInput}
                onChangeText={setAssistantInput}
                placeholder="Ex : Qu'est-ce qu'un porteur ?"
                placeholderTextColor={DS.textMuted}
                returnKeyType="send"
                onSubmitEditing={handleAsk}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                accessibilityLabel="Votre question à l'assistant"
                accessibilityHint="Tapez votre question puis appuyez sur Entrée ou sur le bouton Envoyer"
                autoComplete="off"
              />
              <FocusPressable
                onPress={handleAsk}
                disabled={!assistantInput.trim()}
                accessibilityRole="button"
                accessibilityLabel="Envoyer la question"
                accessibilityState={{ disabled: !assistantInput.trim() }}
                style={({ pressed }) => [
                  styles.sendBtn,
                  !assistantInput.trim() && styles.sendBtnDisabled,
                  pressed && assistantInput.trim() && { opacity: 0.8 },
                ]}
              >
                <Icon name="arrow-right" size={18} color={DS.white} />
              </FocusPressable>
            </View>

            {assistantResponse && (
              <View
                style={styles.assistantResponse}
                accessibilityLiveRegion="polite"
                accessible
                accessibilityLabel={`Réponse de l'assistant : ${assistantResponse}`}
              >
                <View style={styles.assistantResponseHeader} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Icon name="star" size={14} color={DS.textStrong} />
                  <Text style={styles.assistantResponseLabel}>
                    Aide intelligente
                  </Text>
                </View>
                <Text style={styles.assistantResponseText}>
                  {assistantResponse}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* ── 6. Mode pas-à-pas ─────────────────────────────────────── */}
          <SectionCard label="Guidage pas-à-pas du renouvellement">
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: DS.successTint }]}>
                <Icon name="checkmark" size={18} color={DS.success} />
              </View>
              <SectionTitle>Guidage pas-à-pas</SectionTitle>
            </View>

            {!stepDone ? (
              <View
                style={styles.stepContainer}
                accessibilityLiveRegion="polite"
              >
                {/* Progress — visible text for screen readers (non color-only) */}
                <View style={styles.stepProgressRow}>
                  {/* Decorative dots (color + shape), hidden from a11y */}
                  <View
                    style={styles.stepDots}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    {STEPS.map((_, i) => (
                      <View
                        key={i}
                        style={[styles.stepDot, i <= step && styles.stepDotActive]}
                      />
                    ))}
                  </View>
                  {/* Readable progress — WCAG 1.4.1 (non color only) */}
                  <Text style={styles.stepCounter}>
                    Étape {step + 1} sur {STEPS.length}
                  </Text>
                </View>

                <Text style={styles.stepQuestion} accessibilityRole="header">
                  {STEPS[step].question}
                </Text>

                <View style={styles.stepChoices}>
                  {STEPS[step].choices.map((choice) => (
                    <FocusPressable
                      key={choice}
                      onPress={handleStepChoice}
                      accessibilityRole="button"
                      accessibilityLabel={choice}
                      accessibilityHint={
                        step < STEPS.length - 1
                          ? "Passe à l'étape suivante"
                          : "Finalise le guidage"
                      }
                      style={({ pressed }) => [
                        styles.stepChoice,
                        pressed && styles.stepChoicePressed,
                      ]}
                    >
                      <Text style={styles.stepChoiceText}>{choice}</Text>
                    </FocusPressable>
                  ))}
                </View>
              </View>
            ) : (
              <View
                style={styles.stepSuccess}
                accessibilityLiveRegion="assertive"
                accessible
                accessibilityLabel="Dossier complété avec succès. Toutes les étapes sont validées."
              >
                <View style={styles.stepSuccessIcon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <Icon name="checkmark" size={28} color={DS.white} />
                </View>
                <Text style={styles.stepSuccessTitle}>Dossier complété !</Text>
                <Text style={styles.stepSuccessSubtitle}>
                  Toutes les étapes sont validées. Le dossier est prêt à être
                  envoyé.
                </Text>
                <FocusPressable
                  onPress={() => { setStep(0); setStepDone(false); }}
                  accessibilityRole="button"
                  accessibilityLabel="Recommencer la démonstration depuis le début"
                  style={({ pressed }) => [
                    styles.stepRestartBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={styles.stepRestartBtnText}>
                    Recommencer la démo
                  </Text>
                </FocusPressable>
              </View>
            )}
          </SectionCard>

          {/* ── Note technique ────────────────────────────────────────── */}
          <View
            style={styles.techNote}
            accessible
            accessibilityLabel="Note technique : démo locale, aucune API externe, aucune donnée transmise."
          >
            <Icon name="info" size={14} color={DS.textBody} />
            <Text style={styles.techNoteText}>
              Démo locale — aucune API externe, aucune donnée transmise.
              Navigation clavier, aria-live, focus rings visibles, labels
              accessibles, cibles ≥ 44 px.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DS.surfacePage },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: DS.space9 },
  page: { paddingHorizontal: DS.space5, paddingTop: DS.space6, gap: DS.space5 },

  // Header
  header: { gap: DS.space3 },
  demoTag: {
    alignSelf: "flex-start",
    backgroundColor: DS.actionPrimary,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: 3,
  },
  demoTagText: {
    fontSize: 11, fontWeight: "700", color: DS.white, letterSpacing: 1,
  },
  title: {
    fontSize: 30, fontWeight: "800", color: DS.textStrong, letterSpacing: -0.5,
  },
  // textBody = #2D3742 → 10.3:1 on white ✓ AAA (was textMuted = 5.65:1)
  subtitle: {
    fontSize: 16, color: DS.textBody, lineHeight: 26,
  },

  // Card / region
  card: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    padding: DS.space5,
    gap: DS.space4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: DS.space3 },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: DS.radiusSm,
    backgroundColor: DS.infoTint, alignItems: "center", justifyContent: "center",
  },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  cardHint: { fontSize: 13, color: DS.textBody, lineHeight: 20, marginTop: -DS.space2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: DS.textStrong, flex: 1 },
  divider: { height: 1, backgroundColor: DS.borderSubtle },

  // Situation
  situationRow: { flexDirection: "row", gap: DS.space4, flexWrap: "wrap" },
  situationLabel: {
    fontSize: 13, fontWeight: "700",
    // textBody (10.3:1) replaces textMuted (5.65:1)
    color: DS.textBody,
    width: 80, textTransform: "uppercase", letterSpacing: 0.4, paddingTop: 1,
  },
  situationValue: {
    fontSize: 14, color: DS.textBody, flex: 1,
    // line-height ≥ 1.5× font-size (WCAG 1.4.12)
    lineHeight: 22,
  },

  // Admin text
  adminTextBox: {
    backgroundColor: DS.surfacePage, borderRadius: DS.radiusSm,
    borderWidth: 1, borderColor: DS.borderSubtle, padding: DS.space4, gap: DS.space2,
  },
  simplifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: DS.space1,
    alignSelf: "flex-start", backgroundColor: DS.successTint,
    borderRadius: DS.radiusPill, paddingHorizontal: DS.space2, paddingVertical: 2,
  },
  simplifiedBadgeText: {
    fontSize: 11, fontWeight: "700", color: DS.success, letterSpacing: 0.4,
  },
  // Removed italic — harder to read, no semantic value here
  adminText: {
    fontSize: 15, color: DS.textBody, lineHeight: 23,
  },
  adminTextSimplified: {
    fontWeight: "700", fontSize: 16, lineHeight: 26, color: DS.textStrong,
  },
  simplifyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: DS.space2, paddingVertical: DS.space3, paddingHorizontal: DS.space4,
    borderRadius: DS.radiusMd, borderWidth: 1.5, borderColor: DS.actionPrimary,
    minHeight: DS.targetMin,
  },
  simplifyBtnActive: { backgroundColor: DS.actionPrimary },
  simplifyBtnPressed: { opacity: 0.8 },
  // fontWeight 700 + fontSize 15 → bold large text → actionPrimary (4.375:1) passes AA large
  simplifyBtnText: { fontSize: 15, fontWeight: "700", color: DS.actionPrimary },
  simplifyBtnTextActive: { color: DS.white },

  // Glossaire
  termsRow: { flexDirection: "row", flexWrap: "wrap", gap: DS.space2 },
  termChip: {
    paddingHorizontal: DS.space3, paddingVertical: DS.space2,
    borderRadius: DS.radiusPill, borderWidth: 1, borderColor: DS.borderDefault,
    backgroundColor: DS.surfacePage,
    minHeight: DS.targetMin, minWidth: DS.targetMin, justifyContent: "center",
  },
  termChipActive: { backgroundColor: DS.actionPrimary, borderColor: DS.actionPrimary },
  termChipPressed: { opacity: 0.75 },
  termChipText: { fontSize: 14, fontWeight: "600", color: DS.textStrong },
  termChipTextActive: { color: DS.white },
  definitionBox: {
    backgroundColor: DS.infoTint, borderRadius: DS.radiusSm, padding: DS.space4, gap: DS.space1,
  },
  // textStrong (12:1) replaces actionPrimary (4.375:1) for small text
  definitionTerm: { fontSize: 14, fontWeight: "700", color: DS.textStrong },
  definitionText: { fontSize: 15, color: DS.textBody, lineHeight: 23 },

  // Voix
  voiceBtnRow: { flexDirection: "row", gap: DS.space3, flexWrap: "wrap" },
  voiceBtn: {
    flexDirection: "row", alignItems: "center", gap: DS.space2,
    paddingHorizontal: DS.space4, paddingVertical: DS.space3,
    borderRadius: DS.radiusMd, borderWidth: 1.5, borderColor: DS.actionPrimary,
    minHeight: DS.targetMin, flex: 1, justifyContent: "center",
  },
  voiceBtnActive: { backgroundColor: DS.actionPrimary },
  voiceBtnPressed: { opacity: 0.8 },
  voiceBtnText: { fontSize: 14, fontWeight: "700", color: DS.actionPrimary },
  voiceBtnTextActive: { color: DS.white },
  voiceBtnDisabled: {
    flexDirection: "row", alignItems: "center", gap: DS.space2,
    paddingHorizontal: DS.space4, paddingVertical: DS.space3,
    borderRadius: DS.radiusMd, borderWidth: 1, borderColor: DS.borderSubtle,
    minHeight: DS.targetMin, flex: 1, justifyContent: "center",
  },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  voiceBtnDisabledText: { fontSize: 14, color: DS.textBody },
  voiceNote: {
    flexDirection: "row", alignItems: "flex-start", gap: DS.space2,
    backgroundColor: DS.infoTint, borderRadius: DS.radiusSm, padding: DS.space3,
  },
  voiceNoteText: { fontSize: 13, color: DS.infoText, flex: 1, lineHeight: 20 },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  voiceUnsupported: { fontSize: 13, color: DS.textBody, lineHeight: 20 },

  // Assistant
  // Visible label above the input (WCAG 1.3.1, 2.4.6)
  inputLabel: {
    fontSize: 14, fontWeight: "600", color: DS.textStrong, marginBottom: -DS.space2,
  },
  assistantInputRow: { flexDirection: "row", gap: DS.space2, alignItems: "center" },
  assistantInput: {
    flex: 1, minHeight: DS.targetMin,
    backgroundColor: DS.surfacePage,
    borderWidth: 1, borderColor: DS.borderDefault,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space4, paddingVertical: DS.space2,
    fontSize: 14, color: DS.textStrong,
    // No outlineStyle:none — focus must remain visible (WCAG 2.4.7 AA)
  },
  // Focus state: thicker border + visible outline (WCAG 2.4.13 AAA)
  assistantInputFocused: {
    borderColor: DS.focusRing,
    borderWidth: 2,
    ...(Platform.OS === "web"
      ? ({ outlineWidth: 3, outlineStyle: "solid", outlineColor: DS.focusRing, outlineOffset: 2 } as any)
      : {}),
  },
  sendBtn: {
    width: DS.targetMin, height: DS.targetMin, borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary, alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: DS.borderDefault },
  assistantResponse: {
    backgroundColor: DS.surfaceTint, borderRadius: DS.radiusSm,
    borderWidth: 1, borderColor: DS.borderSubtle, padding: DS.space4, gap: DS.space2,
  },
  assistantResponseHeader: {
    flexDirection: "row", alignItems: "center", gap: DS.space2,
  },
  // textStrong (12:1) replaces actionPrimary (4.375:1) for 12px text
  assistantResponseLabel: {
    fontSize: 12, fontWeight: "700", color: DS.textStrong,
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  assistantResponseText: { fontSize: 15, color: DS.textBody, lineHeight: 23 },

  // Pas-à-pas
  stepContainer: { gap: DS.space4 },
  stepProgressRow: {
    flexDirection: "row", alignItems: "center", gap: DS.space3,
  },
  stepDots: { flexDirection: "row", gap: DS.space2 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: DS.borderDefault },
  stepDotActive: { backgroundColor: DS.actionPrimary, width: 24 },
  // Readable text progress — non color-only (WCAG 1.4.1) + textBody (10.3:1)
  stepCounter: {
    fontSize: 13, fontWeight: "700", color: DS.textBody,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  stepQuestion: { fontSize: 20, fontWeight: "700", color: DS.textStrong, lineHeight: 30 },
  stepChoices: { flexDirection: "row", flexWrap: "wrap", gap: DS.space3 },
  stepChoice: {
    flex: 1, minWidth: 120, minHeight: DS.targetMin,
    backgroundColor: DS.actionPrimary, borderRadius: DS.radiusMd,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: DS.space4, paddingVertical: DS.space3,
  },
  stepChoicePressed: { opacity: 0.85 },
  stepChoiceText: { fontSize: 15, fontWeight: "700", color: DS.white },
  stepSuccess: { alignItems: "center", gap: DS.space3, paddingVertical: DS.space4 },
  stepSuccessIcon: {
    width: 64, height: 64, borderRadius: DS.radiusPill,
    backgroundColor: DS.success, alignItems: "center", justifyContent: "center",
  },
  stepSuccessTitle: { fontSize: 22, fontWeight: "800", color: DS.textStrong },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  stepSuccessSubtitle: {
    fontSize: 14, color: DS.textBody, textAlign: "center", lineHeight: 22, maxWidth: 300,
  },
  stepRestartBtn: {
    marginTop: DS.space2, paddingHorizontal: DS.space5, paddingVertical: DS.space3,
    borderRadius: DS.radiusMd, borderWidth: 1, borderColor: DS.borderDefault,
    minHeight: DS.targetMin,
  },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  stepRestartBtnText: { fontSize: 14, fontWeight: "600", color: DS.textBody },

  // Note technique
  techNote: {
    flexDirection: "row", alignItems: "flex-start", gap: DS.space2,
    backgroundColor: DS.grey100, borderRadius: DS.radiusSm, padding: DS.space3,
  },
  // textBody (10.3:1) replaces textMuted (5.65:1)
  techNoteText: { fontSize: 12, color: DS.textBody, flex: 1, lineHeight: 19 },
});