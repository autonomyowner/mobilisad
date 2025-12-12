import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"

import { supabase } from "@/services/supabase/client"

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices")
    return false
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== "granted") {
    console.log("Notification permissions not granted")
    return false
  }

  return true
}

/**
 * Get the Expo push token for this device
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log("Push tokens only work on physical devices")
      return null
    }

    // Request permissions first
    const hasPermission = await requestNotificationPermissions()
    if (!hasPermission) {
      return null
    }

    // Get the token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "97c7d6f2-200d-4534-87ff-eacd62e6ce75", // From app.json eas.projectId
    })

    return tokenData.data
  } catch (error) {
    console.error("Error getting push token:", error)
    return null
  }
}

/**
 * Register the push token with the user's profile in Supabase
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  try {
    const token = await getExpoPushToken()
    if (!token) {
      console.log("No push token available")
      return false
    }

    // Update the user's profile with the push token
    const { error } = await supabase
      .from("user_profiles")
      .update({ push_token: token })
      .eq("id", userId)

    if (error) {
      console.error("Error saving push token:", error)
      return false
    }

    console.log("Push token registered successfully")
    return true
  } catch (error) {
    console.error("Error registering push token:", error)
    return false
  }
}

/**
 * Clear the push token when user logs out
 */
export async function clearPushToken(userId: string): Promise<void> {
  try {
    await supabase
      .from("user_profiles")
      .update({ push_token: null })
      .eq("id", userId)
  } catch (error) {
    console.error("Error clearing push token:", error)
  }
}

/**
 * Set up notification listeners
 * Returns cleanup function to remove listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  // Listener for notifications received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification)
      onNotificationReceived?.(notification)
    }
  )

  // Listener for when user interacts with a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("Notification response:", response)
      onNotificationResponse?.(response)
    }
  )

  // Return cleanup function
  return () => {
    notificationListener.remove()
    responseListener.remove()
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediate
  })
}

// Set up Android notification channel
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("orders", {
    name: "Commandes",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#D4A84B",
  })
}
