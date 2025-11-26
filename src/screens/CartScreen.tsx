import { FC, useState, useEffect, useCallback, useRef } from "react"
import {
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  Pressable,
  Image,
  ImageStyle,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import Svg, { Path } from "react-native-svg"

import { Text } from "@/components/Text"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import { useAuth } from "@/context/AuthContext"
import {
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  subscribeToCart,
  CartItem,
} from "@/services/supabase/cartService"
import { ProductWithImage } from "@/services/supabase/productService"

const COLORS = {
  background: "#0D0D0D",
  surface: "#1A1A1A",
  surfaceElevated: "#242424",
  accent: "#D4A84B",
  text: "#FFFFFF",
  textSecondary: "#8A8A8A",
  textMuted: "#5A5A5A",
  danger: "#E53935",
}

// Trash Icon Component
const TrashIcon: FC<{ size?: number; color?: string }> = ({ size = 20, color = "#FFFFFF" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6H5H21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Plus Icon Component
const PlusIcon: FC<{ size?: number; color?: string }> = ({ size = 16, color = "#FFFFFF" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

// Minus Icon Component
const MinusIcon: FC<{ size?: number; color?: string }> = ({ size = 16, color = "#FFFFFF" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

interface CartScreenProps {
  isVisible?: boolean
  onCheckoutItem?: (product: ProductWithImage, quantity: number, cartItemId: string) => void
}

interface CartItemCardProps {
  item: CartItem
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onCheckout: (item: CartItem) => void
}

const CartItemCard: FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove, onCheckout }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handleRemove = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onRemove(item.id)
    })
  }

  return (
    <Animated.View style={[styles.cartItemCard, { transform: [{ scale: scaleAnim }] }]}>
      {/* Product Image */}
      <Pressable style={styles.cartItemImageContainer} onPress={() => onCheckout(item)}>
        {item.product_image ? (
          <Image
            source={{ uri: item.product_image }}
            style={styles.cartItemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cartItemImagePlaceholder}>
            <Text style={styles.cartItemImagePlaceholderText}>
              {item.product_name.charAt(0)}
            </Text>
          </View>
        )}
      </Pressable>

      {/* Product Info */}
      <Pressable style={styles.cartItemInfo} onPress={() => onCheckout(item)}>
        <Text style={styles.cartItemName} numberOfLines={2}>
          {item.product_name}
        </Text>
        <Text style={styles.cartItemPrice}>
          {item.product_price.toLocaleString('fr-DZ')} DA
        </Text>

        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <Pressable
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
          >
            <MinusIcon size={14} color={COLORS.text} />
          </Pressable>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <Pressable
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <PlusIcon size={14} color={COLORS.text} />
          </Pressable>
        </View>
      </Pressable>

      {/* Remove Button */}
      <Pressable style={styles.removeButton} onPress={handleRemove}>
        <TrashIcon size={18} color={COLORS.danger} />
      </Pressable>

      {/* Item Total and Checkout Button */}
      <View style={styles.itemTotalContainer}>
        <View style={styles.itemTotalLeft}>
          <Text style={styles.itemTotalLabel}>Total</Text>
          <Text style={styles.itemTotalPrice}>
            {(item.product_price * item.quantity).toLocaleString('fr-DZ')} DA
          </Text>
        </View>
        <Pressable style={styles.itemCheckoutButton} onPress={() => onCheckout(item)}>
          <Text style={styles.itemCheckoutButtonText}>Commander</Text>
        </Pressable>
      </View>
    </Animated.View>
  )
}

export const CartScreen: FC<CartScreenProps> = function CartScreen({ isVisible = false, onCheckoutItem }) {
  const $topInsets = useSafeAreaInsetsStyle(["top"])
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const hasLoadedOnce = useRef(false)

  // Load cart items
  const loadCartItems = useCallback(async () => {
    try {
      const items = await getCartItems()
      setCartItems(items)
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial load and subscription
  useEffect(() => {
    if (user) {
      loadCartItems()
      hasLoadedOnce.current = true
      const subscription = subscribeToCart(setCartItems)
      return () => subscription.unsubscribe()
    } else {
      setIsLoading(false)
    }
    return undefined
  }, [user, loadCartItems])

  // Reload cart when tab becomes visible
  useEffect(() => {
    if (isVisible && user && hasLoadedOnce.current) {
      loadCartItems()
    }
  }, [isVisible, user, loadCartItems])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadCartItems()
    setRefreshing(false)
  }, [loadCartItems])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Optimistic update
      setCartItems(prev => prev.filter(item => item.id !== itemId))
      await removeFromCart(itemId)
    } else {
      // Optimistic update
      setCartItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )
      await updateCartItemQuantity(itemId, newQuantity)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
    await removeFromCart(itemId)
  }

  const handleClearCart = async () => {
    setCartItems([])
    await clearCart()
  }

  const handleCheckoutItem = (item: CartItem) => {
    if (onCheckoutItem) {
      // Create a ProductWithImage object from CartItem
      const product: ProductWithImage = {
        id: item.product_id,
        name: item.product_name,
        slug: item.product_id, // Use product_id as slug for cart items
        price: item.product_price,
        image_url: item.product_image,
        brand: '',
        category: '',
        description: undefined,
        original_price: undefined,
        is_new: false,
        is_promo: false,
        in_stock: true,
        rating: undefined,
        viewers_count: undefined,
        video_url: undefined,
        seller_id: undefined,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }
      onCheckoutItem(product, item.quantity, item.id)
    }
  }

  // Calculate totals
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  if (!user) {
    return (
      <View style={[styles.container, $topInsets]}>
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Sign in to view your cart</Text>
          <Text style={styles.emptySubtitle}>
            Your cart items will be saved when you sign in
          </Text>
        </View>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.container, $topInsets]}>
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, $topInsets]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Cart</Text>
        {cartItems.length > 0 && (
          <Pressable onPress={handleClearCart}>
            <Text style={styles.clearButton}>Clear all</Text>
          </Pressable>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Tap the heart on any product to add it to your cart
          </Text>
        </View>
      ) : (
        <>
          {/* Cart Items */}
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
            {cartItems.map((item) => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
                onCheckout={handleCheckoutItem}
              />
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Bottom Info */}
          <View style={styles.bottomInfoContainer}>
            <Text style={styles.bottomInfoText}>
              {itemCount} {itemCount === 1 ? 'article' : 'articles'} dans votre panier
            </Text>
            <Text style={styles.bottomInfoSubtext}>
              Cliquez sur "Commander" pour passer votre commande
            </Text>
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  } as ViewStyle,

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  } as ViewStyle,

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
  } as TextStyle,

  clearButton: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.danger,
  } as TextStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollContent: {
    padding: 16,
  } as ViewStyle,

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 100,
  } as ViewStyle,

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  } as TextStyle,

  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
  } as TextStyle,

  // Cart Item Card
  cartItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    flexWrap: "wrap",
  } as ViewStyle,

  cartItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: COLORS.surfaceElevated,
  } as ViewStyle,

  cartItemImage: {
    width: "100%",
    height: "100%",
  } as ImageStyle,

  cartItemImagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
  } as ViewStyle,

  cartItemImagePlaceholderText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.accent,
  } as TextStyle,

  cartItemInfo: {
    flex: 1,
    marginLeft: 12,
  } as ViewStyle,

  cartItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  } as TextStyle,

  cartItemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.accent,
    marginBottom: 8,
  } as TextStyle,

  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  } as ViewStyle,

  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  quantityText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 24,
    textAlign: "center",
  } as TextStyle,

  removeButton: {
    padding: 8,
  } as ViewStyle,

  itemTotalContainer: {
    width: "100%",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  } as ViewStyle,

  itemTotalLeft: {
    flexDirection: "column",
  } as ViewStyle,

  itemTotalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  } as TextStyle,

  itemTotalPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  } as TextStyle,

  itemCheckoutButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  } as ViewStyle,

  itemCheckoutButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.background,
  } as TextStyle,

  // Bottom Info
  bottomInfoContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 100,
    alignItems: "center",
  } as ViewStyle,

  bottomInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  } as TextStyle,

  bottomInfoSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  } as TextStyle,
})
