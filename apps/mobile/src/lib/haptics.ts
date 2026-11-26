import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

/**
 * A light tap, to confirm a press that changes something. A phone with no vibration motor, or with
 * haptics turned off, may refuse it; the press must work all the same, so a refusal is dropped.
 */
export function lightTap(): void {
  impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined);
}
