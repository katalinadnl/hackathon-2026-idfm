import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthScreen } from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { BottomTabInset, DS } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();

  if (!token) return <AuthScreen />;

  return (
    <View style={styles.screen}>
      <SafeAreaView
        edges={Platform.OS === "web" ? [] : ["top"]}
        style={styles.safe}
      >
        <View style={styles.header}>
          <Icon name="person" size={28} color={DS.actionPrimary} />
          <Text style={styles.title} accessibilityRole="header">
            Mon compte
          </Text>
        </View>

        <Card style={styles.card}>
          <Row label="Email" value={user?.email ?? "—"} />
          <View style={styles.sep} />
          <Row label="N° de compte" value={user?.accountNumber ?? "—"} />
        </Card>

        <View
          style={{
            paddingHorizontal: DS.space5,
            paddingBottom: BottomTabInset + DS.space6,
          }}
        >
          <Button
            variant="danger"
            size="lg"
            fullWidth
            leadingIcon="log-out"
            onPress={logout}
            accessibilityLabel="Se déconnecter"
          >
            Se déconnecter
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DS.surfacePage },
  safe: { flex: 1, gap: DS.space5 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: DS.space3,
    paddingHorizontal: DS.space5,
    paddingTop: DS.space5,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: DS.textStrong,
    letterSpacing: -0.5,
  },
  card: { marginHorizontal: DS.space5, gap: 0 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DS.space3,
    gap: DS.space4,
  },
  rowLabel: { fontSize: 15, color: DS.textMuted, fontWeight: "600" },
  rowValue: {
    fontSize: 15,
    color: DS.textStrong,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  sep: { height: 1, backgroundColor: DS.borderSubtle },
});
