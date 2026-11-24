/**
 * Every user-facing string, in English and Arabic. Keys are typed from the English tree (see
 * i18next.d.ts). Digits are never written into a string: numbers are interpolated and always
 * Latin. Plural keys carry one suffix per plural category of the language (English two,
 * Arabic six); a test checks the categories and that both languages have the same keys.
 *
 * The Arabic text needs review by a native speaker.
 */
const en = {
  app: { name: 'Nabd', tagline: 'Live markets, simulated' },
  nav: {
    label: 'Main navigation',
    stocks: 'Stocks',
    watchlist: 'Watchlist',
    skipToContent: 'Skip to content',
  },
  theme: { label: 'Theme', light: 'Light', dark: 'Dark', system: 'System' },
  language: { label: 'Language' },
  connection: {
    label: 'Connection status',
    connecting: 'Connecting…',
    connected: 'Live',
    reconnecting: 'Reconnecting…',
    offline: 'Offline',
  },
  simulated: {
    badge: 'Simulated market data',
    description: 'All prices are simulated and are not real market data.',
  },
  errors: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. You can try again.',
    retry: 'Try again',
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist.',
    home: 'Back to stocks',
  },
  pages: { stocks: 'Stocks', watchlist: 'Watchlist', stock: 'Stock details' },
  loading: { page: 'Loading…' },
  change: { up: 'Up', down: 'Down', flat: 'Unchanged' },
  count: { stocks_one: '{{count}} stock', stocks_other: '{{count}} stocks' },
} as const;

interface Tree {
  readonly [key: string]: string | Tree;
}

const ar: Tree = {
  app: { name: 'نبض', tagline: 'أسواق حيّة، بيانات محاكاة' },
  nav: {
    label: 'التنقل الرئيسي',
    stocks: 'الأسهم',
    watchlist: 'قائمة المراقبة',
    skipToContent: 'تخطَّ إلى المحتوى',
  },
  theme: { label: 'المظهر', light: 'فاتح', dark: 'داكن', system: 'النظام' },
  language: { label: 'اللغة' },
  connection: {
    label: 'حالة الاتصال',
    connecting: 'جارٍ الاتصال…',
    connected: 'مباشر',
    reconnecting: 'جارٍ إعادة الاتصال…',
    offline: 'غير متصل',
  },
  simulated: {
    badge: 'بيانات سوق محاكاة',
    description: 'جميع الأسعار محاكاة وليست بيانات سوق حقيقية.',
  },
  errors: {
    title: 'حدث خطأ ما',
    description: 'حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى.',
    retry: 'حاول مرة أخرى',
  },
  notFound: {
    title: 'الصفحة غير موجودة',
    description: 'الصفحة التي تبحث عنها غير موجودة.',
    home: 'العودة إلى الأسهم',
  },
  pages: { stocks: 'الأسهم', watchlist: 'قائمة المراقبة', stock: 'تفاصيل السهم' },
  loading: { page: 'جارٍ التحميل…' },
  change: { up: 'ارتفاع', down: 'انخفاض', flat: 'دون تغيير' },
  count: {
    stocks_zero: 'لا أسهم',
    stocks_one: 'سهم واحد',
    stocks_two: 'سهمان',
    stocks_few: '{{count}} أسهم',
    stocks_many: '{{count}} سهمًا',
    stocks_other: '{{count}} سهم',
  },
};

export const defaultNS = 'translation';

export const resources = {
  en: { [defaultNS]: en },
  ar: { [defaultNS]: ar },
} as const;
