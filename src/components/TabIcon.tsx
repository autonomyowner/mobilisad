import React from "react"
import Svg, { Path, Circle, Rect } from "react-native-svg"
import { View, Text, StyleSheet } from "react-native"

interface TabIconProps {
  name: "home" | "shop" | "freelance" | "dashboard" | "profile"
  active?: boolean
  size?: number
  color?: string
  badge?: number
  badgeColor?: string
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  active = false,
  size = 24,
  color = "#FFFFFF",
  badge,
  badgeColor = "#D4A84B",
}) => {
  // Refined thin stroke for elegant minimal look
  const strokeWidth = active ? 2 : 1.5

  const renderIcon = () => {
    switch (name) {
      case "home":
        // Minimal house outline
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {active ? (
              // Filled version
              <Path
                d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                fill={color}
              />
            ) : (
              // Outline version
              <>
                <Path
                  d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 21V14H15V21"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </Svg>
        )

      case "shop":
        // Elegant shopping bag
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {active ? (
              <>
                <Path
                  d="M4 7H20L19 21H5L4 7Z"
                  fill={color}
                />
                <Path
                  d="M8 7V6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V7"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <Path
                  d="M4 7H20L19 21H5L4 7Z"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M8 7V6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V7"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            )}
          </Svg>
        )

      case "freelance":
        // Briefcase - work/services
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {active ? (
              <>
                <Rect x="2" y="7" width="20" height="14" rx="2" fill={color} />
                <Path
                  d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <Rect
                  x="2"
                  y="7"
                  width="20"
                  height="14"
                  rx="2"
                  stroke={color}
                  strokeWidth={strokeWidth}
                />
                <Path
                  d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                <Path
                  d="M2 12H22"
                  stroke={color}
                  strokeWidth={strokeWidth}
                />
              </>
            )}
          </Svg>
        )

      case "dashboard":
        // Minimal grid/dashboard
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {active ? (
              <>
                <Rect x="3" y="3" width="8" height="8" rx="1.5" fill={color} />
                <Rect x="13" y="3" width="8" height="8" rx="1.5" fill={color} />
                <Rect x="3" y="13" width="8" height="8" rx="1.5" fill={color} />
                <Rect x="13" y="13" width="8" height="8" rx="1.5" fill={color} />
              </>
            ) : (
              <>
                <Rect x="3" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
                <Rect x="13" y="3" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
                <Rect x="3" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
                <Rect x="13" y="13" width="8" height="8" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
              </>
            )}
          </Svg>
        )

      case "profile":
        // Minimal user avatar
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            {active ? (
              <>
                <Circle cx="12" cy="8" r="4" fill={color} />
                <Path
                  d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21"
                  stroke={color}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
                <Path
                  d="M4 21C4 17.134 7.58172 14 12 14C16.4183 14 20 17.134 20 21"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            )}
          </Svg>
        )

      default:
        return null
    }
  }

  return (
    <View style={{ width: size, height: size }}>
      {renderIcon()}
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badgeContainer, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#D4A84B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0A0A0A',
  },
  badgeText: {
    color: '#0A0A0A',
    fontSize: 9,
    fontWeight: '700',
  },
})

