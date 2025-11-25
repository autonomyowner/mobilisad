import { FC, useRef, useState, useEffect, useCallback } from "react"
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
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import { Video, ResizeMode } from "expo-av"
import Svg, { Path, Circle } from "react-native-svg"

import { Text } from "@/components/Text"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import {
  fetchNewProducts,
  fetchFournisseurProducts,
  fetchProductCategories,
  fetchAllProducts,
  subscribeToProducts,
  ProductWithImage,
} from "@/services/supabase"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

// Colors
const COLORS = {
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#242424",
  accent: "#D4A84B",
  accentDark: "#B8922F",
  text: "#FFFFFF",
  textSecondary: "#8A8A8A",
  textMuted: "#5A5A5A",
  danger: "#E53935",
}

// Search Icon Component
const SearchIcon: FC<{ size?: number; color?: string }> = ({ size = 24, color = "#FFFFFF" }) => {
  const strokeWidth = 2.5
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 20L16 16"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Cart Icon Component
const CartIcon: FC<{ size?: number; color?: string }> = ({ size = 24, color = "#FFFFFF" }) => {
  const strokeWidth = 2.5
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 6C6 3.79086 7.79086 2 10 2H14C16.2091 2 18 3.79086 18 6V7H20C21.1046 7 22 7.89543 22 9V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V9C2 7.89543 2.89543 7 4 7H6V6Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 7V6C6 3.79086 7.79086 2 10 2H14C16.2091 2 18 3.79086 18 6V7"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface ProductCardProps {
  product: ProductWithImage
  compact?: boolean
  horizontal?: boolean
  onPress?: (product: ProductWithImage) => void
}

const ProductCard: FC<ProductCardProps> = ({ product, compact, horizontal, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start()
  }

  const handlePress = () => {
    if (onPress) {
      onPress(product)
    }
  }

  // Calculate discount percentage
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  // Determine card style based on props
  const getCardStyle = () => {
    if (compact) return styles.productCardCompact
    if (horizontal) return styles.productCardHorizontal
    return styles.productCard
  }

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
      <Animated.View
        style={[
          getCardStyle(),
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Discount Badge */}
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}

        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {product.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>{product.name.charAt(0)}</Text>
            </View>
          )}
        </View>

        {/* Wishlist Button */}
        <Pressable style={styles.wishlistButton}>
          <Text style={styles.wishlistIcon}>&#9825;</Text>
        </Pressable>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Rating */}
          {product.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.starIcon}>&#9733;</Text>
              <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({product.viewers_count})</Text>
            </View>
          )}

          <Text style={styles.brandText}>{product.brand}</Text>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>{product.price.toLocaleString('fr-DZ')} DA</Text>
            {product.original_price && product.original_price > product.price && (
              <Text style={styles.originalPrice}>{product.original_price.toLocaleString('fr-DZ')} DA</Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  )
}

interface MarketplaceScreenProps {
  onNavigateToCart?: () => void
  onProductPress?: (product: ProductWithImage) => void
}

export const MarketplaceScreen: FC<MarketplaceScreenProps> = function MarketplaceScreen({ onNavigateToCart, onProductPress }) {
  const $topInsets = useSafeAreaInsetsStyle(["top"])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [newProducts, setNewProducts] = useState<ProductWithImage[]>([])
  const [saleProducts, setSaleProducts] = useState<ProductWithImage[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const videoRef = useRef<Video>(null)

  // Play video on mount
  useEffect(() => {
    videoRef.current?.playAsync()
  }, [])

  // Fetch data from Supabase
  const loadData = useCallback(async () => {
    try {
      const [newProds, fournisseurProds, cats] = await Promise.all([
        fetchNewProducts(10),
        fetchFournisseurProducts(20),
        fetchProductCategories(),
      ])

      // If no "new" products, fetch all products
      if (newProds.length === 0) {
        const allProducts = await fetchAllProducts()
        setNewProducts(allProducts.slice(0, 10))
      } else {
        setNewProducts(newProds)
      }

      // Display products from fournisseurs in the Sale section
      if (fournisseurProds.length === 0) {
        // Fallback: if no fournisseur products, show all products
        const allProducts = await fetchAllProducts()
        setSaleProducts(allProducts.slice(0, 10))
      } else {
        setSaleProducts(fournisseurProds)
      }

      setCategories(cats)
    } catch (error) {
      console.error('Error loading marketplace data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadData()
  }, [loadData])

  // Real-time subscription
  useEffect(() => {
    const subscription = subscribeToProducts(() => {
      loadData()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  return (
    <View style={[styles.container, $topInsets]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Video Advertisement Hero - Full Width */}
        <View style={styles.videoHeroContainer}>
          {/* Video Background */}
          <Video
            ref={videoRef}
            source={require("../../assets/videos/DJwd0gEh5mS.mp4")}
            style={styles.videoBackground}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted
          />

          {/* Floating Icons Only */}
          <View style={styles.floatingHeaderIcons}>
            <Pressable style={styles.iconButton}>
              <SearchIcon size={24} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={onNavigateToCart}>
              <CartIcon size={24} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <Pressable key={index} style={styles.categoryChip}>
                <Text style={styles.categoryName}>{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* New Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>New</Text>
              <Text style={styles.sectionSubtitle}>You've never seen it before!</Text>
            </View>
            <Pressable>
              <Text style={styles.viewAllText}>View all</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : newProducts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsRow}
            >
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} horizontal onPress={onProductPress} />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Fournisseur Products Section (Sale) - Vertical Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.saleSectionTitle}>Sale</Text>
              <Text style={styles.sectionSubtitle}>Products from our suppliers</Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : saleProducts.length > 0 ? (
            <View style={styles.productsGrid}>
              {saleProducts.map((product) => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} onPress={onProductPress} />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No products available</Text>
            </View>
          )}
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

  // Video Hero Container - Full Width
  videoHeroContainer: {
    width: SCREEN_WIDTH,
    height: 300,
    position: "relative",
    overflow: "hidden",
    marginTop: -20,
  } as ViewStyle,

  videoBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  } as ViewStyle,

  // Floating Icons Over Video
  floatingHeaderIcons: {
    position: "absolute",
    top: 30,
    right: 20,
    flexDirection: "row",
    gap: 16,
    zIndex: 100,
  } as ViewStyle,

  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  // Categories
  categoriesContainer: {
    marginTop: 20,
  } as ViewStyle,

  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  } as ViewStyle,

  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  } as ViewStyle,

  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  } as TextStyle,

  categoryCount: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginLeft: 8,
  } as TextStyle,

  // Section
  section: {
    marginTop: 28,
  } as ViewStyle,

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 16,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  } as TextStyle,

  saleSectionTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.danger,
  } as TextStyle,

  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  } as TextStyle,

  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.accent,
  } as TextStyle,

  productsRow: {
    paddingHorizontal: 20,
  } as ViewStyle,

  // Vertical Grid for Sale products
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  } as ViewStyle,

  gridItem: {
    width: (SCREEN_WIDTH - 48) / 2,
    marginBottom: 16,
  } as ViewStyle,

  // Product Card
  productCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
  } as ViewStyle,

  productCardHorizontal: {
    width: SCREEN_WIDTH * 0.44,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 14,
  } as ViewStyle,

  productCardCompact: {
    width: SCREEN_WIDTH * 0.38,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginRight: 14,
  } as ViewStyle,

  discountBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  } as ViewStyle,

  discountText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  } as TextStyle,

  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceElevated,
  } as ViewStyle,

  productImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,

  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  } as ViewStyle,

  wishlistIcon: {
    fontSize: 18,
    color: COLORS.background,
  } as TextStyle,

  productInfo: {
    padding: 12,
  } as ViewStyle,

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  } as ViewStyle,

  starIcon: {
    fontSize: 12,
    color: COLORS.accent,
  } as TextStyle,

  ratingText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 4,
  } as TextStyle,

  reviewsText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 2,
  } as TextStyle,

  brandText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  } as TextStyle,

  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  } as TextStyle,

  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,

  productPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.accent,
  } as TextStyle,

  originalPrice: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
    marginLeft: 6,
  } as TextStyle,

  imagePlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  imagePlaceholderText: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.accent,
  } as TextStyle,

  loadingContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  emptyState: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
  } as TextStyle,
})
