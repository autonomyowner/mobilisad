import { FC, useEffect, useState, useCallback } from "react"
import {
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native"

import { Text } from "@/components/Text"
import { useSafeAreaInsetsStyle } from "@/utils/useSafeAreaInsetsStyle"
import {
  fetchFreelanceServices,
  fetchFreelanceServicesByCategory,
  getServiceCategories,
  FreelanceService,
  ServiceCategory,
} from "@/services/supabase/freelanceService"

// Luxe Art Deco Color Palette (matching Dashboard)
const COLORS = {
  background: "#08080A",
  surface: "#111114",
  surfaceElevated: "#1A1A1F",
  surfaceBorder: "#2A2A30",
  gold: "#C9A227",
  goldLight: "#E8C547",
  goldDark: "#9A7B1A",
  goldMuted: "rgba(201, 162, 39, 0.15)",
  text: "#FAFAFA",
  textSecondary: "#9A9AA0",
  textMuted: "#5A5A60",
  success: "#22C55E",
  successMuted: "rgba(34, 197, 94, 0.15)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.15)",
  error: "#EF4444",
  errorMuted: "rgba(239, 68, 68, 0.15)",
  info: "#3B82F6",
  infoMuted: "rgba(59, 130, 246, 0.15)",
}

interface FreelanceOffersScreenProps {
  onBack: () => void
}

// Service Card Component
interface ServiceCardProps {
  service: FreelanceService
}

const ServiceCard: FC<ServiceCardProps> = ({ service }) => {
  const getPriceTypeLabel = (type: string) => {
    switch (type) {
      case "fixed":
        return "Prix fixe"
      case "hourly":
        return "/heure"
      case "starting-at":
        return "A partir de"
      default:
        return ""
    }
  }

  const getAvailabilityStyle = (status: string) => {
    switch (status) {
      case "available":
        return { bg: COLORS.successMuted, text: COLORS.success, label: "Disponible" }
      case "busy":
        return { bg: COLORS.warningMuted, text: COLORS.warning, label: "Occupe" }
      case "unavailable":
        return { bg: COLORS.errorMuted, text: COLORS.error, label: "Indisponible" }
      default:
        return { bg: COLORS.surfaceBorder, text: COLORS.textSecondary, label: status }
    }
  }

  const availabilityStyle = getAvailabilityStyle(service.availability)

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceTitle} numberOfLines={2}>
          {service.service_title}
        </Text>
        <View style={styles.badgesRow}>
          {service.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verifie</Text>
            </View>
          )}
          <View style={[styles.availabilityBadge, { backgroundColor: availabilityStyle.bg }]}>
            <Text style={[styles.availabilityText, { color: availabilityStyle.text }]}>
              {availabilityStyle.label}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.serviceDescription} numberOfLines={3}>
        {service.short_description || service.description}
      </Text>

      <View style={styles.categoryRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{service.category}</Text>
        </View>
      </View>

      <View style={styles.serviceMeta}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceValue}>{(service.price || 0).toLocaleString()} DA</Text>
          <Text style={styles.priceType}>{getPriceTypeLabel(service.price_type)}</Text>
        </View>

        <View style={styles.experienceBadge}>
          <Text style={styles.experienceText}>{service.experience_level}</Text>
        </View>
      </View>

      {service.delivery_time && (
        <View style={styles.deliveryRow}>
          <Text style={styles.deliveryLabel}>Delai:</Text>
          <Text style={styles.deliveryValue}>{service.delivery_time}</Text>
        </View>
      )}

      {service.rating !== undefined && service.rating > 0 && (
        <View style={styles.ratingRow}>
          <Text style={styles.ratingValue}>{service.rating.toFixed(1)}</Text>
          <Text style={styles.ratingLabel}>({service.reviews_count || 0} avis)</Text>
          {service.completed_projects > 0 && (
            <Text style={styles.projectsLabel}>
              - {service.completed_projects} projet{service.completed_projects > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}

      {service.skills && service.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {service.skills.slice(0, 3).map((skill, index) => (
            <View key={index} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
          {service.skills.length > 3 && (
            <Text style={styles.moreSkills}>+{service.skills.length - 3}</Text>
          )}
        </View>
      )}

      {service.provider && (
        <Text style={styles.providerName}>Par {service.provider.full_name}</Text>
      )}
    </View>
  )
}

export const FreelanceOffersScreen: FC<FreelanceOffersScreenProps> = ({ onBack }) => {
  const $topInsets = useSafeAreaInsetsStyle(["top"])
  const $bottomInsets = useSafeAreaInsetsStyle(["bottom"])

  const [services, setServices] = useState<FreelanceService[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const categoriesData = await getServiceCategories()
      setCategories(categoriesData)

      const servicesData = selectedCategory
        ? await fetchFreelanceServicesByCategory(selectedCategory)
        : await fetchFreelanceServices()
      setServices(servicesData)
    } catch (error) {
      console.error("Error loading freelance data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const handleCategorySelect = (category: ServiceCategory | null) => {
    setSelectedCategory(category)
    setIsLoading(true)
  }

  if (isLoading) {
    return (
      <View style={[styles.container, $topInsets, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, $topInsets]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Freelancers</Text>
          <Text style={styles.headerSubtitle}>Services disponibles</Text>
        </View>
      </View>

      {/* Category Filters */}
      {categories.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === null && styles.categoryChipActive,
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === null && styles.categoryChipTextActive,
                ]}
              >
                Tous
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Services List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, $bottomInsets]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
            colors={[COLORS.gold]}
          />
        }
      >
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Aucun service</Text>
            <Text style={styles.emptyStateText}>
              {selectedCategory
                ? "Aucun service trouve dans cette categorie"
                : "Aucun service freelance disponible pour le moment"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsCount}>
              {services.length} service{services.length > 1 ? "s" : ""} trouve
              {services.length > 1 ? "s" : ""}
            </Text>
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  } as ViewStyle,
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
  } as TextStyle,

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  } as ViewStyle,
  backButton: {
    marginBottom: 12,
  } as ViewStyle,
  backButtonText: {
    fontSize: 14,
    color: COLORS.gold,
    fontWeight: "500",
  } as TextStyle,
  headerTitleContainer: {} as ViewStyle,
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  } as TextStyle,
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  } as TextStyle,

  // Filters
  filtersContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  } as ViewStyle,
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  } as ViewStyle,
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginRight: 8,
  } as ViewStyle,
  categoryChipActive: {
    backgroundColor: COLORS.goldMuted,
    borderColor: COLORS.goldDark,
  } as ViewStyle,
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  } as TextStyle,
  categoryChipTextActive: {
    color: COLORS.gold,
  } as TextStyle,

  // Scroll View
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  } as ViewStyle,

  // Results count
  resultsCount: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  } as TextStyle,

  // Service Card
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 16,
    marginBottom: 12,
  } as ViewStyle,
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 12,
  } as ViewStyle,
  serviceTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 22,
  } as TextStyle,
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  } as ViewStyle,
  availabilityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  } as ViewStyle,
  availabilityText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  } as TextStyle,
  serviceDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  } as TextStyle,
  categoryRow: {
    flexDirection: "row",
    marginBottom: 12,
  } as ViewStyle,
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.infoMuted,
    borderRadius: 6,
  } as ViewStyle,
  categoryText: {
    fontSize: 11,
    color: COLORS.info,
    fontWeight: "500",
  } as TextStyle,
  serviceMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  } as ViewStyle,
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  } as ViewStyle,
  priceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gold,
  } as TextStyle,
  priceType: {
    fontSize: 12,
    color: COLORS.textSecondary,
  } as TextStyle,
  experienceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  } as ViewStyle,
  experienceText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  } as TextStyle,
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  } as ViewStyle,
  deliveryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  } as TextStyle,
  deliveryValue: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: "500",
  } as TextStyle,
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  } as ViewStyle,
  ratingValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.goldLight,
  } as TextStyle,
  ratingLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  } as TextStyle,
  projectsLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  } as TextStyle,
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  } as ViewStyle,
  skillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 4,
  } as ViewStyle,
  skillText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  } as TextStyle,
  moreSkills: {
    fontSize: 10,
    color: COLORS.textMuted,
  } as TextStyle,
  providerName: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: "italic",
    marginTop: 4,
  } as TextStyle,
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.successMuted,
    borderRadius: 6,
  } as ViewStyle,
  verifiedText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: "600",
  } as TextStyle,

  // Empty State
  emptyState: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 40,
    alignItems: "center",
    marginTop: 20,
  } as ViewStyle,
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  } as TextStyle,
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 20,
  } as TextStyle,
})
