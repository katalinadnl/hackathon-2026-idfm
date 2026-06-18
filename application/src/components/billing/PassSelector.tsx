import { useCallback, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { DS } from "@/constants/theme";
import { ROLE_LABELS } from "@/lib/format";
import { PassSummary } from "@/lib/api/billing";

type Props = {
  passes: PassSummary[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
};

const SCROLL_STEP = 180;

export function PassSelector({ passes, selectedId, onSelect }: Props) {
  const showAll = passes.length > 1;
  const scrollRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollState = useRef({ offset: 0, contentWidth: 0, viewWidth: 0 });

  const updateArrows = useCallback(() => {
    const { offset, contentWidth, viewWidth } = scrollState.current;
    const overflow = contentWidth > viewWidth + 1;
    setCanScrollLeft(overflow && offset > 1);
    setCanScrollRight(overflow && offset < contentWidth - viewWidth - 1);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollState.current.offset = e.nativeEvent.contentOffset.x;
      scrollState.current.viewWidth = e.nativeEvent.layoutMeasurement.width;
      scrollState.current.contentWidth = e.nativeEvent.contentSize.width;
      updateArrows();
    },
    [updateArrows],
  );

  const handleContentSizeChange = useCallback(
    (w: number) => {
      scrollState.current.contentWidth = w;
      updateArrows();
    },
    [updateArrows],
  );

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      scrollState.current.viewWidth = e.nativeEvent.layout.width;
      updateArrows();
    },
    [updateArrows],
  );

  const scrollBy = useCallback((delta: number) => {
    const next = Math.max(0, scrollState.current.offset + delta);
    scrollRef.current?.scrollTo({ x: next, animated: true });
  }, []);

  const showNav = canScrollLeft || canScrollRight;

  return (
    <View style={styles.container}>
      <View style={styles.scrollRow}>
        {showNav && (
          <Pressable
            onPress={() => scrollBy(-SCROLL_STEP)}
            disabled={!canScrollLeft}
            style={({ pressed }) => [
              styles.navBtn,
              !canScrollLeft && styles.navBtnDisabled,
              pressed && canScrollLeft && styles.navBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Défiler vers la gauche"
          >
            <Icon
              name="arrow-left"
              size={16}
              color={canScrollLeft ? DS.actionPrimary : DS.borderDefault}
            />
          </Pressable>
        )}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContent}
          style={styles.scroll}
          accessibilityRole="tablist"
        >
          {showAll && (
            <Pill
              label="Tous mes passes"
              selected={selectedId === null}
              onPress={() => onSelect(null)}
            />
          )}
          {passes.map((p) => (
            <Pill
              key={p.subscriptionId}
              label={p.subscriptionType}
              sublabel={p.holderName}
              roles={p.roles.map((r) => ROLE_LABELS[r])}
              selected={selectedId === p.subscriptionId}
              onPress={() => onSelect(p.subscriptionId)}
            />
          ))}
        </ScrollView>

        {showNav && (
          <Pressable
            onPress={() => scrollBy(SCROLL_STEP)}
            disabled={!canScrollRight}
            style={({ pressed }) => [
              styles.navBtn,
              !canScrollRight && styles.navBtnDisabled,
              pressed && canScrollRight && styles.navBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Défiler vers la droite"
          >
            <Icon
              name="chevron-right"
              size={16}
              color={canScrollRight ? DS.actionPrimary : DS.borderDefault}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Pill({
  label,
  sublabel,
  roles,
  selected,
  onPress,
}: {
  label: string;
  sublabel?: string;
  roles?: string[];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>
        {label}
      </Text>
      {sublabel && (
        <Text style={[styles.pillSub, selected && styles.pillSubSelected]}>
          {sublabel}
        </Text>
      )}
      {roles && roles.length > 0 && (
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <Badge key={r} tone={selected ? "brand" : "info"}>
              {r}
            </Badge>
          ))}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  scrollRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: DS.space3,
    paddingVertical: DS.space2,
    paddingHorizontal: DS.space1,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: DS.radiusPill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DS.surfaceCard,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    flexShrink: 0,
    ...Platform.select({
      web: { cursor: "pointer" as any },
      default: {},
    }),
  },
  navBtnDisabled: {
    opacity: 0.4,
    ...Platform.select({
      web: { cursor: "default" as any },
      default: {},
    }),
  },
  navBtnPressed: {
    backgroundColor: DS.bluePale,
    borderColor: DS.actionPrimary,
  },
  pill: {
    minWidth: 140,
    paddingHorizontal: DS.space4,
    paddingVertical: DS.space3,
    borderRadius: DS.radiusMd,
    borderWidth: 1.5,
    borderColor: DS.borderDefault,
    backgroundColor: DS.surfaceCard,
    gap: 4,
    justifyContent: "center",
  },
  pillSelected: {
    borderColor: DS.actionPrimary,
    backgroundColor: DS.bluePale,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: DS.textStrong,
  },
  pillLabelSelected: {
    color: DS.actionPrimary,
  },
  pillSub: {
    fontSize: 13,
    color: DS.textMuted,
  },
  pillSubSelected: {
    color: DS.actionPrimary,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
});
