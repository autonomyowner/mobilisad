import { FC, useEffect, useRef } from "react"
import {
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import Svg, { Path } from "react-native-svg"

import { Text } from "@/components/Text"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

// Luxe Art Deco Color Palette
const COLORS = {
  background: "#08080A",
  surface: "#111114",
  surfaceElevated: "#1A1A1F",
  surfaceBorder: "#2A2A30",
  gold: "#C9A227",
  goldLight: "#E8C547",
  goldDark: "#9A7B1A",
  goldMuted: "rgba(201, 162, 39, 0.15)",
  goldGlow: "rgba(201, 162, 39, 0.3)",
  text: "#FAFAFA",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A60",
  success: "#22C55E",
  successLight: "#4ADE80",
  successMuted: "rgba(34, 197, 94, 0.15)",
}

// Animated Success Checkmark with Art Deco styling - Compact version
const AnimatedCheckmark: FC<{ delay?: number }> = ({ delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current
  const checkAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const sequence = Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(checkAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ])

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )

    sequence.start(() => pulse.start())
  }, [delay])

  return (
    <Animated.View
      style={[
        styles.checkmarkContainer,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Animated.View
        style={[
          styles.outerRing,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />

      <LinearGradient
        colors={[COLORS.goldLight, COLORS.gold, COLORS.goldDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.checkmarkCircle}
      >
        <View style={styles.checkmarkInner}>
          <Animated.View
            style={{
              opacity: checkAnim,
              transform: [
                {
                  scale: checkAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1.15, 1],
                  }),
                },
              ],
            }}
          >
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 12.5L9.5 18L20 6"
                stroke={COLORS.gold}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </View>
      </LinearGradient>
    </Animated.View>
  )
}

// Decorative geometric lines
const DecorativeLines: FC<{ delay?: number }> = ({ delay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [delay])

  return (
    <Animated.View
      style={[
        styles.decorativeLines,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.decoLine} />
      <View style={styles.decoDiamond} />
      <View style={styles.decoLine} />
    </Animated.View>
  )
}

// Animated text reveal
const AnimatedText: FC<{
  children: React.ReactNode
  delay?: number
  style?: TextStyle | TextStyle[]
}> = ({ children, delay = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [delay])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <Text style={style}>{children}</Text>
    </Animated.View>
  )
}

// Order detail row with animation
const OrderDetailRow: FC<{
  label: string
  value: string
  delay?: number
  highlight?: boolean
}> = ({ label, value, delay = 0, highlight = false }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [delay])

  return (
    <Animated.View
      style={[
        styles.detailRow,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {value}
      </Text>
    </Animated.View>
  )
}

interface OrderConfirmationModalProps {
  visible: boolean
  orderNumber: string
  productName: string
  quantity: number
  totalAmount: number
  customerName: string
  wilaya: string
  onClose: () => void
}

export const OrderConfirmationModal: FC<OrderConfirmationModalProps> = ({
  visible,
  orderNumber,
  productName,
  quantity,
  totalAmount,
  customerName,
  wilaya,
  onClose,
}) => {
  const backdropAnim = useRef(new Animated.Value(0)).current
  const cardAnim = useRef(new Animated.Value(0)).current
  const cardSlideAnim = useRef(new Animated.Value(100)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(cardAnim, {
          toValue: 1,
          tension: 50,
          friction: 10,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.spring(cardSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 10,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      backdropAnim.setValue(0)
      cardAnim.setValue(0)
      cardSlideAnim.setValue(100)
    }
  }, [visible])

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose())
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Animated backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        {/* Floating particles effect */}
        <View style={styles.particlesContainer}>
          {[...Array(6)].map((_, i) => (
            <FloatingParticle key={i} index={i} />
          ))}
        </View>
      </Animated.View>

      {/* Main content */}
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardAnim,
              transform: [
                { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                { translateY: cardSlideAnim },
              ],
            },
          ]}
        >
          {/* Top decorative bar */}
          <LinearGradient
            colors={[COLORS.goldDark, COLORS.gold, COLORS.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBar}
          />

          {/* Success checkmark */}
          <AnimatedCheckmark delay={200} />

          {/* Success message */}
          <AnimatedText style={styles.successTitle} delay={400}>
            Commande Confirmee
          </AnimatedText>

          {/* Order number badge */}
          <View style={styles.orderBadge}>
            <AnimatedText style={styles.orderNumber} delay={500}>
              #{orderNumber}
            </AnimatedText>
          </View>

          {/* Decorative lines */}
          <DecorativeLines delay={600} />

          {/* Order details */}
          <View style={styles.detailsSection}>
            <OrderDetailRow
              label="Produit"
              value={productName.length > 22 ? productName.slice(0, 22) + "..." : productName}
              delay={700}
            />
            <OrderDetailRow
              label="Quantite"
              value={`x${quantity}`}
              delay={750}
            />
            <OrderDetailRow
              label="Livraison"
              value={wilaya}
              delay={800}
            />
            <View style={styles.totalDivider} />
            <OrderDetailRow
              label="Total"
              value={`${totalAmount.toLocaleString("fr-DZ")} DA`}
              delay={850}
              highlight
            />
          </View>

          {/* Info message */}
          <AnimatedText style={styles.infoMessage} delay={900}>
            Vous serez contacte pour confirmer la livraison
          </AnimatedText>

          {/* Close button */}
          <AnimatedButton delay={950} onPress={handleClose} />

          {/* Bottom decorative bar */}
          <LinearGradient
            colors={[COLORS.goldDark, COLORS.gold, COLORS.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bottomBar}
          />
        </Animated.View>
      </View>
    </Modal>
  )
}

// Animated button component
const AnimatedButton: FC<{ delay: number; onPress: () => void }> = ({
  delay,
  onPress,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start()
  }, [delay])

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        width: "100%",
      }}
    >
      <TouchableOpacity
        style={styles.closeButton}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[COLORS.goldDark, COLORS.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.closeButtonGradient}
        >
          <Text style={styles.closeButtonText}>Fermer</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}

// Floating particle effect
const FloatingParticle: FC<{ index: number }> = ({ index }) => {
  const animY = useRef(new Animated.Value(0)).current
  const animOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const startDelay = index * 200

    Animated.sequence([
      Animated.delay(startDelay),
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(animOpacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animOpacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(animY, {
            toValue: -SCREEN_HEIGHT,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start()
  }, [index])

  const left = (index * 37) % 100

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: `${left}%`,
          opacity: animOpacity,
          transform: [{ translateY: animY }],
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  } as ViewStyle,

  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  } as ViewStyle,

  particle: {
    position: "absolute",
    bottom: -20,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gold,
  } as ViewStyle,

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  } as ViewStyle,

  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: "hidden",
    alignItems: "center",
  } as ViewStyle,

  topBar: {
    width: "100%",
    height: 3,
  } as ViewStyle,

  bottomBar: {
    width: "100%",
    height: 3,
  } as ViewStyle,

  // Checkmark styles - Compact
  checkmarkContainer: {
    marginTop: 24,
    marginBottom: 16,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  outerRing: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: COLORS.goldMuted,
  } as ViewStyle,

  checkmarkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
  } as ViewStyle,

  checkmarkInner: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  // Decorative lines - Compact
  decorativeLines: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  } as ViewStyle,

  decoLine: {
    width: 28,
    height: 1,
    backgroundColor: COLORS.goldMuted,
  } as ViewStyle,

  decoDiamond: {
    width: 5,
    height: 5,
    backgroundColor: COLORS.gold,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 8,
  } as ViewStyle,

  // Text styles - Compact
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 8,
  } as TextStyle,

  // Order badge - Compact
  orderBadge: {
    backgroundColor: COLORS.goldMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.goldDark,
    marginBottom: 12,
  } as ViewStyle,

  orderNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,

  // Details section - Compact
  detailsSection: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 12,
  } as ViewStyle,

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  } as ViewStyle,

  detailLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  } as TextStyle,

  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  } as TextStyle,

  detailValueHighlight: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.gold,
  } as TextStyle,

  totalDivider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: 6,
  } as ViewStyle,

  // Info message - Compact
  infoMessage: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 16,
    marginBottom: 16,
  } as TextStyle,

  // Close button - Compact
  closeButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
  } as ViewStyle,

  closeButtonGradient: {
    paddingVertical: 12,
    alignItems: "center",
  } as ViewStyle,

  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.background,
    letterSpacing: 0.3,
  } as TextStyle,
})

export default OrderConfirmationModal
