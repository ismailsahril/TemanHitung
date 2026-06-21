import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Utility to trigger device haptic feedback (vibration).
 * Runs on native mobile platform using the Capacitor Haptics plugin.
 */
export async function triggerHaptic(style: ImpactStyle, enabled: boolean): Promise<void> {
  if (!enabled || !Capacitor.isNativePlatform()) return;
  try {
    await Haptics.impact({ style });
  } catch (error) {
    const isDev = import.meta.env.DEV;
    if (isDev) {
      console.warn('Haptic feedback failed or unsupported:', error);
    }
  }
}
