import { FC, useRef, useState } from "react"
import {
  Animated,
  Dimensions,
  Image,
  ImageStyle,
  Pressable,
  ScrollView,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { Text } from "@/components/Text"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Colors - matching the marketplace theme
const COLORS = {
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceElevated: "#F5F5F5",
  accent: "#D4A84B",
  accentDark: "#B8922F",
  text: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textMuted: "#9A9A9A",
  danger: "#E53935",
  black: "#0D0D0D",
  border: "#EBEBEB",
}

// Tab categories
const TABS = ["Women", "Men", "Kids"]

// Category data with images
const CATEGORIES = [
  {
    id: "1",
    name: "New",
    itemCount: 147,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400",
  },
  {
    id: "2",
    name: "Clothes",
    itemCount: 256,
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
  },
  {
    id: "3",
    name: "Shoes",
    itemCount: 89,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400",
  },
  {
    id: "4",
    name: "Accessories",
    itemCount: 134,
    image: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400",
  },
  {
    id: "5",
    name: "Bags",
    itemCount: 67,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",
  },
]

interface CategoryCardProps {
  category: (typeof CATEGORIES)[0]
  index: number
}

const CategoryCard: FC<CategoryCardProps> = ({ category, index }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const isEven = index % 2 === 0

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start()
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.categoryCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Text Side */}
        <View style={[styles.categoryTextSide, isEven ? {} : styles.categoryTextRight]}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categoryCount}>{category.itemCount} items</Text>
        </View>

        {/* Image Side */}
        <View style={[styles.categoryImageSide, isEven ? styles.imageRight : styles.imageLeft]}>
          <Image
            source={{ uri: category.image }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        </View>

        {/* Decorative accent line */}
        <View style={[styles.accentLine, isEven ? styles.accentRight : styles.accentLeft]} />
      </Animated.View>
    </Pressable>
  )
}

interface TabButtonProps {
  label: string
  isActive: boolean
  onPress: () => void
}

const TabButton: FC<TabButtonProps> = ({ label, isActive, onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.tabButton}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
      {isActive && <View style={styles.tabIndicator} />}
    </Pressable>
  )
}

export const ShopScreen: FC = function ShopScreen() {
  const $topInsets = useSafeAreaInsetsStyle(["top"])
  const [activeTab, setActiveTab] = useState("Women")

  return (
    <View style={[styles.container, $topInsets]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Categories</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onPress={() => setActiveTab(tab)}
            />
          ))}
        </View>

        {/* Sale Banner */}
        <View style={styles.saleBanner}>
          <View style={styles.saleBannerContent}>
            <Text style={styles.saleTitle}>SUMMER SALES</Text>
            <Text style={styles.saleSubtitle}>Up to 50% off</Text>
          </View>
          {/* Decorative elements */}
          <View style={styles.saleAccent1} />
          <View style={styles.saleAccent2} />
        </View>

        {/* Categories Grid */}
        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </View>

        {/* Spacer for bottom nav */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  } as ViewStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    paddingBottom: 20,
  } as ViewStyle,

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: COLORS.black,
  } as ViewStyle,

  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.surface,
    textAlign: "center",
    letterSpacing: 0.5,
  } as TextStyle,

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,

  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    position: "relative",
  } as ViewStyle,

  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textMuted,
    letterSpacing: 0.3,
  } as TextStyle,

  tabTextActive: {
    color: COLORS.text,
    fontWeight: "700",
  } as TextStyle,

  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  } as ViewStyle,

  // Sale Banner
  saleBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    height: 100,
    borderRadius: 16,
    backgroundColor: COLORS.black,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  } as ViewStyle,

  saleBannerContent: {
    paddingHorizontal: 28,
    zIndex: 2,
  } as ViewStyle,

  saleTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.surface,
    letterSpacing: 2,
    marginBottom: 4,
  } as TextStyle,

  saleSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  } as TextStyle,

  saleAccent1: {
    position: "absolute",
    right: -20,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.accent,
    opacity: 0.15,
  } as ViewStyle,

  saleAccent2: {
    position: "absolute",
    right: 40,
    bottom: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.accent,
    opacity: 0.1,
  } as ViewStyle,

  // Categories
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 16,
  } as ViewStyle,

  categoryCard: {
    flexDirection: "row",
    height: 120,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    position: "relative",
  } as ViewStyle,

  categoryTextSide: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  } as ViewStyle,

  categoryTextRight: {
    alignItems: "flex-end",
  } as ViewStyle,

  categoryName: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: 0.3,
  } as TextStyle,

  categoryCount: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
  } as TextStyle,

  categoryImageSide: {
    width: SCREEN_WIDTH * 0.45,
    height: "100%",
  } as ViewStyle,

  imageRight: {
    borderTopLeftRadius: 60,
    borderBottomLeftRadius: 60,
    overflow: "hidden",
  } as ViewStyle,

  imageLeft: {
    borderTopRightRadius: 60,
    borderBottomRightRadius: 60,
    overflow: "hidden",
  } as ViewStyle,

  categoryImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,

  accentLine: {
    position: "absolute",
    width: 4,
    height: 40,
    backgroundColor: COLORS.accent,
    top: "50%",
    marginTop: -20,
    borderRadius: 2,
  } as ViewStyle,

  accentRight: {
    left: 0,
  } as ViewStyle,

  accentLeft: {
    right: 0,
  } as ViewStyle,
})
