import { IBMPlexSans_400Regular, IBMPlexSans_600SemiBold } from '@expo-google-fonts/ibm-plex-sans';
import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_600SemiBold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import { loadAsync } from 'expo-font';

/** The font family names the app's styles use. Only these two weights, as on the web. */
export const fontFamily = {
  regular: 'IBMPlexSans_400Regular',
  semibold: 'IBMPlexSans_600SemiBold',
} as const;

/** Loads IBM Plex Sans and IBM Plex Sans Arabic. The Arabic family is used once Arabic is shown (M4). */
export function loadFonts(): Promise<void> {
  return loadAsync({
    IBMPlexSans_400Regular,
    IBMPlexSans_600SemiBold,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_600SemiBold,
  });
}
