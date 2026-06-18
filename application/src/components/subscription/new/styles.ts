import { StyleSheet } from "react-native";
import { DS } from "@/constants/theme";

export const s = StyleSheet.create({
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
  chip: {},
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
  deptField: {
    gap: DS.space2,
  },
  deptSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
  },
  deptSelectedChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
    paddingVertical: DS.space3,
    paddingHorizontal: DS.space4,
  },
  deptSelectedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: DS.textStrong,
  },
  deptChangeLink: {
    fontSize: 13,
    color: DS.actionPrimary,
    fontWeight: "600",
  },
  // En flux normal (pas de position absolute) : pousse le contenu suivant
  // au lieu de risquer d'être coupé par un ScrollView ou un zIndex frère.
  deptDropdown: {
    marginTop: 4,
    paddingVertical: DS.space1,
    gap: 0,
    borderWidth: 1,
    borderColor: DS.borderSubtle,
  },
  deptDropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
    paddingVertical: DS.space3,
    paddingHorizontal: DS.space3,
  },
  deptDropdownCode: {
    fontSize: 14,
    fontWeight: "700",
    color: DS.actionPrimary,
    width: 32,
  },
  deptDropdownName: {
    fontSize: 14,
    color: DS.textStrong,
    flex: 1,
  },

  existingBeneficiaryBlock: {
    gap: DS.space2,
    paddingBottom: DS.space3,
    borderBottomWidth: 1,
    borderBottomColor: DS.borderSubtle,
    width: "100%",
  },
});
