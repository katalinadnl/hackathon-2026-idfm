import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { ApiSubscription, useSubscriptions } from "@/hooks/use-subscriptions";
import { pageInner, usePageLayout } from "@/hooks/use-page-layout";
import {
  ActionId,
  AdvisorResponse,
  INITIAL_MESSAGE,
  matchRules,
} from "@/lib/advisor/rule-engine";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  actions: ActionId[];
  simplified: string;
  showSimplified: boolean;
}

// ─── Action config ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionId, { label: string; icon: string; href: string }> = {
  renew:         { label: "Renouveler",              icon: "arrow-right",  href: "/subscriptions" },
  add_document:  { label: "Ajouter un justificatif", icon: "post",         href: "/subscriptions" },
  block_pass:    { label: "Bloquer mon pass",         icon: "lock",         href: "/subscriptions" },
  new_pass:      { label: "Commander un nouveau pass",icon: "ticket",       href: "/subscriptions" },
  change_payer:  { label: "Changer le payeur",        icon: "receipt",      href: "/billing" },
  regularize:    { label: "Régulariser un paiement",  icon: "creditcard",   href: "/billing" },
  download_cert: { label: "Télécharger une attestation", icon: "link",     href: "/billing" },
  view_offers:   { label: "Voir les offres compatibles", icon: "star",     href: "/visitors" },
};

const QUICK_SUGGESTIONS = [
  "Renouveler mon abonnement",
  "J'ai perdu mon pass",
  "Justificatif manquant",
  "Paiement échoué",
  "Je ne comprends pas",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function botMessageFromResponse(resp: AdvisorResponse): Message {
  return {
    id: String(Date.now() + Math.random()),
    role: "bot",
    text: resp.answer,
    actions: resp.actions,
    simplified: resp.simplified,
    showSimplified: false,
  };
}

// ─── Markdown-lite renderer (bold only) ────────────────────────────────────────

function RichText({ text, style }: { text: string; style?: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <Text key={i} style={styles.bold}>
              {part.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={i}>{part}</Text>;
      })}
    </Text>
  );
}

// ─── Voice hook (web only) ─────────────────────────────────────────────────────

function useVoice(onTranscript: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const onTranscriptRef = useRef(onTranscript);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  });

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  function startListening() {
    if (Platform.OS !== "web") return;
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
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
      onTranscriptRef.current(transcript);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognizerRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopListening() {
    if (!recognizerRef.current) return;
    try { recognizerRef.current.stop(); } catch {}
    setListening(false);
  }

  return { supported, listening, startListening, stopListening };
}

function speakText(text: string) {
  if (Platform.OS !== "web") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*\*/g, "").replace(/\n/g, " ");
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = "fr-FR";
  window.speechSynthesis.speak(utt);
}

// ─── Subscription summary (left panel) ────────────────────────────────────────

function SubSummaryCard({ sub }: { sub: ApiSubscription }) {
  const days = daysLeft(sub.endDate);
  const isExpiring = days > 0 && days <= 30;
  const isExpired = days <= 0;

  return (
    <View style={styles.subCard}>
      <View style={styles.subCardHeader}>
        <Icon name="ticket" size={16} color={DS.actionPrimary} />
        <Text style={styles.subCardType} numberOfLines={1}>
          {sub.subscriptionType}
        </Text>
        <Badge
          tone={isExpired ? "danger" : isExpiring ? "warning" : "success"}
          dot
        >
          {isExpired ? "Expiré" : isExpiring ? `J-${days}` : "Actif"}
        </Badge>
      </View>
      <Text style={styles.subCardBene}>
        {sub.beneficiary.firstName} {sub.beneficiary.lastName}
      </Text>
      <Text style={styles.subCardDate}>
        Jusqu'au {formatDate(sub.endDate)}
      </Text>
      <View style={styles.subCardRoles}>
        {sub.roles.map((r) => (
          <View key={r} style={styles.roleChip}>
            <Text style={styles.roleChipText}>
              {r === "titulaire" ? "Titulaire" : r === "payeur" ? "Payeur" : "Gestionnaire"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onToggleSimplified,
  onAction,
  onSpeak,
  isLast,
}: {
  msg: Message;
  onToggleSimplified: () => void;
  onAction: (href: string) => void;
  onSpeak: (text: string) => void;
  isLast: boolean;
}) {
  const isBot = msg.role === "bot";
  const displayText = msg.showSimplified ? msg.simplified : msg.text;

  return (
    <View style={[styles.bubbleRow, isBot ? styles.bubbleRowBot : styles.bubbleRowUser]}>
      {isBot && (
        <View style={styles.botAvatar} accessibilityElementsHidden>
          <Icon name="star" size={14} color={DS.white} />
        </View>
      )}

      <View style={[styles.bubble, isBot ? styles.bubbleBot : styles.bubbleUser]}>
        <RichText
          text={displayText}
          style={isBot ? styles.bubbleTextBot : styles.bubbleTextUser}
        />

        {isBot && (
          <View style={styles.bubbleFooter}>
            {msg.simplified && (
              <Pressable
                onPress={onToggleSimplified}
                accessibilityRole="button"
                accessibilityLabel={msg.showSimplified ? "Afficher la réponse complète" : "Afficher en langage simplifié"}
                style={({ pressed }) => [styles.simplifyBtn, pressed && styles.simplifyBtnPressed]}
              >
                <Icon name="accessibility" size={13} color={DS.actionPrimary} />
                <Text style={styles.simplifyBtnText}>
                  {msg.showSimplified ? "Version complète" : "Simplifier"}
                </Text>
              </Pressable>
            )}
            {isLast && Platform.OS === "web" && (
              <Pressable
                onPress={() => onSpeak(displayText)}
                accessibilityRole="button"
                accessibilityLabel="Lire la réponse à voix haute"
                style={({ pressed }) => [styles.simplifyBtn, pressed && styles.simplifyBtnPressed]}
              >
                <Text style={[styles.simplifyBtnText, { color: DS.textMuted }]}>Écouter</Text>
              </Pressable>
            )}
          </View>
        )}

        {isBot && msg.actions.length > 0 && (
          <View style={styles.actionsRow}>
            {msg.actions.map((id) => {
              const cfg = ACTION_CONFIG[id];
              return (
                <Pressable
                  key={id}
                  onPress={() => onAction(cfg.href)}
                  accessibilityRole="button"
                  accessibilityLabel={cfg.label}
                  style={({ pressed }) => [styles.actionChip, pressed && styles.actionChipPressed]}
                >
                  <Icon name={cfg.icon} size={13} color={DS.actionPrimary} />
                  <Text style={styles.actionChipText}>{cfg.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isDesktop } = usePageLayout();
  const { subscriptions, loading } = useSubscriptions(user?.id ?? null);

  const [messages, setMessages] = useState<Message[]>([
    botMessageFromResponse(INITIAL_MESSAGE),
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const handleTranscript = (text: string) => setInput(text);
  const { supported: voiceSupported, listening, startListening, stopListening } =
    useVoice(handleTranscript);

  function scrollToBottom() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      text: trimmed,
      actions: [],
      simplified: "",
      showSimplified: false,
    };

    const response = matchRules(trimmed, subscriptions);
    const botMsg = botMessageFromResponse(response);

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
    scrollToBottom();
  }

  function toggleSimplified(id: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, showSimplified: !m.showSimplified } : m,
      ),
    );
  }

  return (
    <SafeAreaView
      style={styles.screen}
      edges={Platform.OS === "web" ? [] : ["top"]}
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <View style={[pageInner, styles.pageHeaderInner]}>
          <Pressable
            onPress={() => router.push("/dashboard")}
            accessibilityRole="button"
            accessibilityLabel="Retour au tableau de bord"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          >
            <Icon name="arrow-left" size={20} color={DS.actionPrimary} />
            <Text style={styles.backBtnText}>Tableau de bord</Text>
          </Pressable>

          <View style={styles.pageHeaderTitle}>
            <View style={styles.advisorIcon}>
              <Icon name="star" size={18} color={DS.white} />
            </View>
            <View>
              <Text style={styles.pageTitle}>Conseiller IA Mobilité</Text>
              <Text style={styles.pageSubtitle}>Assistant Comutitres</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Body */}
      <View style={[styles.body, isDesktop && styles.bodyDesktop]}>
        {/* Left: subscription context */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            <Text style={styles.panelTitle}>Vos abonnements</Text>
            {loading ? (
              <Text style={styles.mutedText}>Chargement…</Text>
            ) : subscriptions.length === 0 ? (
              <Text style={styles.mutedText}>Aucun abonnement trouvé.</Text>
            ) : (
              subscriptions.map((s) => <SubSummaryCard key={s.id} sub={s} />)
            )}
          </View>
        )}

        {/* Right: chat */}
        <View style={styles.chatPanel}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLast={i === messages.length - 1}
                onToggleSimplified={() => toggleSimplified(msg.id)}
                onAction={(href) => router.push(href as any)}
                onSpeak={speakText}
              />
            ))}
          </ScrollView>

          {/* Quick suggestions */}
          {messages.length <= 1 && (
            <View style={styles.suggestionsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestions}
              >
                {QUICK_SUGGESTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => sendMessage(s)}
                    accessibilityRole="button"
                    accessibilityLabel={s}
                    style={({ pressed }) => [styles.suggestionChip, pressed && styles.suggestionChipPressed]}
                  >
                    <Text style={styles.suggestionChipText}>{s}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            {voiceSupported && (
              <Pressable
                onPress={listening ? stopListening : startListening}
                accessibilityRole="button"
                accessibilityLabel={listening ? "Arrêter la dictée" : "Dicter une question"}
                style={({ pressed }) => [
                  styles.iconBtn,
                  listening && styles.iconBtnActive,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Icon
                  name={listening ? "mic-off" : "mic"}
                  size={20}
                  color={listening ? DS.white : DS.actionPrimary}
                />
              </Pressable>
            )}

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={listening ? "Dictée en cours…" : "Posez votre question…"}
              placeholderTextColor={DS.textMuted}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
              accessibilityLabel="Zone de saisie de question"
              multiline={false}
            />

            <Pressable
              onPress={() => sendMessage(input)}
              disabled={!input.trim()}
              accessibilityRole="button"
              accessibilityLabel="Envoyer la question"
              style={({ pressed }) => [
                styles.sendBtn,
                !input.trim() && styles.sendBtnDisabled,
                pressed && input.trim() && { opacity: 0.8 },
              ]}
            >
              <Icon name="arrow-right" size={20} color={DS.white} />
            </Pressable>
          </View>

          {!voiceSupported && Platform.OS === "web" && (
            <Text style={styles.voiceUnsupported}>
              Votre navigateur ne supporte pas la dictée vocale.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DS.surfacePage,
  },
  pageHeader: {
    backgroundColor: DS.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    paddingVertical: DS.space4,
    paddingHorizontal: DS.space5,
  },
  pageHeaderInner: {
    gap: DS.space3,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  pageHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  advisorIcon: {
    width: 40,
    height: 40,
    borderRadius: DS.radiusMd,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    color: DS.textMuted,
    fontWeight: "500",
  },
  body: {
    flex: 1,
  },
  bodyDesktop: {
    flexDirection: "row",
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center" as any,
    paddingHorizontal: DS.space5,
    paddingTop: DS.space5,
    gap: DS.space5,
  },
  leftPanel: {
    width: 280,
    gap: DS.space3,
    paddingBottom: DS.space5,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: DS.textMuted,
    textTransform: "uppercase" as any,
    letterSpacing: 0.8,
    marginBottom: DS.space1,
  },
  subCard: {
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusMd,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    padding: DS.space4,
    gap: DS.space2,
  },
  subCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  subCardType: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: DS.textStrong,
  },
  subCardBene: {
    fontSize: 13,
    color: DS.textBody,
    fontWeight: "600",
  },
  subCardDate: {
    fontSize: 12,
    color: DS.textMuted,
  },
  subCardRoles: {
    flexDirection: "row",
    gap: DS.space1,
    flexWrap: "wrap" as any,
  },
  roleChip: {
    backgroundColor: DS.blueSoft,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space2,
    paddingVertical: 2,
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  mutedText: {
    fontSize: 13,
    color: DS.textMuted,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: DS.surfaceCard,
    borderRadius: DS.radiusLg,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    overflow: "hidden" as any,
    marginBottom: DS.space5,
    ...(Platform.OS === "web"
      ? ({ boxShadow: "0px 1px 4px rgba(37, 48, 59, 0.08)" } as any)
      : {}),
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: DS.space4,
    gap: DS.space4,
    paddingBottom: DS.space5,
  },
  bubbleRow: {
    flexDirection: "row",
    gap: DS.space2,
    maxWidth: "88%",
    flexShrink: 1,
  },
  bubbleRowBot: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubbleRowUser: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  bubble: {
    borderRadius: DS.radiusMd,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space3,
    gap: DS.space3,
    flexShrink: 1,
    minWidth: 0,
  },
  bubbleBot: {
    backgroundColor: DS.surfaceTint,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
    borderTopLeftRadius: DS.radiusXs,
  },
  bubbleUser: {
    backgroundColor: DS.actionPrimary,
    borderTopRightRadius: DS.radiusXs,
  },
  bubbleTextBot: {
    fontSize: 14,
    color: DS.textBody,
    lineHeight: 21,
  },
  bubbleTextUser: {
    fontSize: 14,
    color: DS.white,
    lineHeight: 21,
  },
  bold: {
    fontWeight: "700",
  },
  bubbleFooter: {
    flexDirection: "row",
    gap: DS.space3,
    flexWrap: "wrap" as any,
  },
  simplifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space1,
    paddingVertical: 2,
  },
  simplifyBtnPressed: {
    opacity: 0.7,
  },
  simplifyBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap" as any,
    gap: DS.space2,
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
    paddingTop: DS.space3,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space1,
    backgroundColor: DS.surfaceCard,
    borderWidth: 1,
    borderColor: DS.borderBrand,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space1,
  },
  actionChipPressed: {
    backgroundColor: DS.blueSoft,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: DS.actionPrimary,
  },
  suggestionsWrapper: {
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
  },
  suggestions: {
    flexDirection: "row",
    alignItems: "center",
    padding: DS.space3,
    gap: DS.space2,
  },
  suggestionChip: {
    backgroundColor: DS.surfacePage,
    borderWidth: 1,
    borderColor: DS.borderDefault,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space3,
    paddingVertical: DS.space2,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  suggestionChipPressed: {
    backgroundColor: DS.blueSoft,
    borderColor: DS.actionPrimary,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: DS.textStrong,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    padding: DS.space3,
    borderTopWidth: 1,
    borderTopColor: DS.borderSubtle,
    backgroundColor: DS.surfaceCard,
  },
  input: {
    flex: 1,
    minHeight: DS.targetMin,
    backgroundColor: DS.surfacePage,
    borderWidth: 1,
    borderColor: DS.borderDefault,
    borderRadius: DS.radiusPill,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space2,
    fontSize: 14,
    color: DS.textStrong,
    outlineStyle: "none" as any,
  },
  iconBtn: {
    width: DS.targetMin,
    height: DS.targetMin,
    borderRadius: DS.radiusPill,
    borderWidth: 1.5,
    borderColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnActive: {
    backgroundColor: DS.actionPrimary,
    borderColor: DS.actionPrimary,
  },
  sendBtn: {
    width: DS.targetMin,
    height: DS.targetMin,
    borderRadius: DS.radiusPill,
    backgroundColor: DS.actionPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: DS.borderDefault,
  },
  voiceUnsupported: {
    fontSize: 11,
    color: DS.textMuted,
    textAlign: "center" as any,
    paddingBottom: DS.space2,
    paddingHorizontal: DS.space4,
  },
});
