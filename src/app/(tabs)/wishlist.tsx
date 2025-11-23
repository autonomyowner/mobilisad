import { View, StyleSheet, Text } from "react-native"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

const COLORS = {
  background: "#0D0D0D",
  accent: "#D4A84B",
  text: "#FFFFFF",
  textSecondary: "#8A8A8A",
}

export default function WishlistTab() {
  const $topInsets = useSafeAreaInsetsStyle(["top"])

  return (
    <View style={[styles.container, $topInsets]}>
      <Text style={styles.title}>Wishlist</Text>
      <Text style={styles.subtitle}>No items in wishlist</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
})
