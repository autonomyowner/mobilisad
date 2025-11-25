import React from "react"
import Svg, { Path, Circle } from "react-native-svg"
import { View, ViewStyle, Text, StyleSheet } from "react-native"

interface TabIconProps {
  name: "home" | "shop" | "freelance" | "dashboard" | "profile"
  active?: boolean
  size?: number
  color?: string
  badge?: number
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  active = false,
  size = 24,
  color = "#FFFFFF",
  badge,
}) => {
  const strokeWidth = 2.5
  const cornerRadius = 4

  const renderIcon = () => {
    switch (name) {
      case "home":
        // Filled home icon (always filled, Instagram style)
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9.5 21V14.5C9.5 13.9477 9.94772 13.5 10.5 13.5H13.5C14.0523 13.5 14.5 13.9477 14.5 14.5V21M3 9.5L12 3L21 9.5V19.5C21 20.6046 20.1046 21.5 19 21.5H5C3.89543 21.5 3 20.6046 3 19.5V9.5Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={active ? 0 : strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )

      case "shop":
        // Shopping bag with rounded corners
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6C6 3.79086 7.79086 2 10 2H14C16.2091 2 18 3.79086 18 6V7H20C21.1046 7 22 7.89543 22 9V20C22 21.1046 21.1046 22 20 22H4C2.89543 22 2 21.1046 2 20V9C2 7.89543 2.89543 7 4 7H6V6Z"
              fill={active ? color : "none"}
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

      case "freelance":
        // Briefcase/Reels style - rounded square with play icon
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V8Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M8 5V4C8 2.89543 8.89543 2 10 2H14C15.1046 2 16 2.89543 16 4V5"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M3 10H21"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )

      case "dashboard":
        // Bar chart / Analytics icon with rounded squares
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 19V10C3 9.44772 3.44772 9 4 9H7C7.55228 9 8 9.44772 8 10V19C8 19.5523 7.55228 20 7 20H4C3.44772 20 3 19.5523 3 19Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M10 19V5C10 4.44772 10.4477 4 11 4H14C14.5523 4 15 4.44772 15 5V19C15 19.5523 14.5523 20 14 20H11C10.4477 20 10 19.5523 10 19Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M17 19V13C17 12.4477 17.4477 12 18 12H21C21.5523 12 22 12.4477 22 13V19C22 19.5523 21.5523 20 21 20H18C17.4477 20 17 19.5523 17 19Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )

      case "profile":
        // User profile circle with silhouette
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle
              cx="12"
              cy="12"
              r="9"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z"
              fill={active ? color : "none"}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M6.16797 18.8409C6.70043 16.6229 8.76497 15 11.25 15H12.75C15.235 15 17.2996 16.6229 17.832 18.8409"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
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
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
})

