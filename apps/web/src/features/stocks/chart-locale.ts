/**
 * The locale the chart formats its time axis and crosshair with. Arabic uses `-u-nu-latn`, so the
 * month and weekday names are Arabic but the digits stay Latin, like every other figure in the
 * app. Without it the library follows the browser's locale and can show Arabic-Indic digits.
 */
export function chartLocale(language: string | undefined): string {
  return language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
}
