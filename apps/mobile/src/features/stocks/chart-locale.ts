/**
 * The locale the chart formats its time axis and crosshair with. Arabic uses `-u-nu-latn`, so the
 * month and weekday names are Arabic but the digits stay Latin, like every other figure in the
 * app. Without it the page follows the phone's locale and can show Arabic-Indic digits, which the
 * chart spike on a real phone did. The web app has the same function in `apps/web`.
 */
export function chartLocale(language: string | undefined): string {
  return language === 'ar' ? 'ar-u-nu-latn' : 'en-US';
}
