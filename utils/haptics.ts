import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const canTriggerHaptics = Platform.OS !== "web";

export async function triggerSuccessHaptic() {
  if (!canTriggerHaptics) return;

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore haptic failures on unsupported device configurations.
  }
}

export async function triggerWarningHaptic() {
  if (!canTriggerHaptics) return;

  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Ignore haptic failures on unsupported device configurations.
  }
}
