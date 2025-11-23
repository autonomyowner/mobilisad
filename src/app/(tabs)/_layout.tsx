import { Tabs } from "expo-router"
import { View, StyleSheet, Pressable, Text } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const COLORS = {
  background: "#0D0D0D",
  surface: "#1A1A1A",
  accent: "#D4A84B",
  textMuted: "#5A5A5A",
  text: "#FFFFFF",
}

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: "absolute",
          elevation: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: -4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#127968;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#128717;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#128722;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#9825;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>&#128100;</Text>
          ),
        }}
      />
    </Tabs>
  )
}
