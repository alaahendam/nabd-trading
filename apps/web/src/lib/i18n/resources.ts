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
  attribution: {
    chartNotice: 'TradingView Lightweight Charts™ · Copyright © 2025 TradingView, Inc.',
  },
  watchlist: {
    toggle: 'Watch {{symbol}}',
    toggleError: 'Could not update your watchlist',
    loading: 'Loading watchlist…',
    error: 'Could not load your watchlist',
    empty: {
      title: 'Your watchlist is empty',
      description: 'Star a stock to follow it here.',
      action: 'Browse stocks',
    },
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
  stocks: {
    loading: 'Loading stocks…',
    empty: 'No stocks to show',
    error: 'Could not load stocks',
    errorHint: 'Check your connection and try again.',
    stale: 'Delayed',
    loadMore: 'Load more stocks',
    loadingMore: 'Loading…',
    loadMoreError: 'Could not load more stocks',
  },
  stock: {
    loading: 'Loading stock…',
    error: 'Could not load this stock',
    notFound: {
      title: 'Stock not found',
      description: 'There is no stock with the symbol {{symbol}}.',
    },
    stats: {
      open: 'Open',
      high: 'High',
      low: 'Low',
      previousClose: 'Previous close',
      volume: 'Volume',
    },
  },
  chart: {
    loading: 'Loading chart…',
    empty: 'No chart data for this period',
    error: 'Could not load the chart',
    custom: {
      label: 'Custom',
      from: 'From',
      to: 'To',
      apply: 'Apply',
      problem: {
        invalid: 'Enter both dates',
        order: 'The start date must not be after the end date',
        future: 'Dates in the future are not available',
        tooOld: 'Dates older than a year are not available',
      },
    },
    label: '{{symbol}} price chart: {{period}}',
    summary: {
      text: '{{period}}: from {{start}} to {{end}}, {{change}}. High {{high}}, low {{low}}.',
      up: 'up {{value}}',
      down: 'down {{value}}',
      flat: 'unchanged',
    },
    period: {
      label: 'Chart period',
      '1D': 'Past day',
      '1W': 'Past week',
      '1M': 'Past month',
      '3M': 'Past 3 months',
      '1Y': 'Past year',
    },
  },
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
  attribution: {
    chartNotice: 'TradingView Lightweight Charts™ · Copyright © 2025 TradingView, Inc.',
  },
  watchlist: {
    toggle: 'متابعة {{symbol}}',
    toggleError: 'تعذّر تحديث قائمة المراقبة',
    loading: 'جارٍ تحميل قائمة المراقبة…',
    error: 'تعذّر تحميل قائمة المراقبة',
    empty: {
      title: 'قائمة المراقبة فارغة',
      description: 'ضع نجمة على سهم لمتابعته هنا.',
      action: 'تصفّح الأسهم',
    },
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
  stocks: {
    loading: 'جارٍ تحميل الأسهم…',
    empty: 'لا توجد أسهم لعرضها',
    error: 'تعذّر تحميل الأسهم',
    errorHint: 'تحقق من اتصالك ثم حاول مرة أخرى.',
    stale: 'متأخر',
    loadMore: 'تحميل المزيد من الأسهم',
    loadingMore: 'جارٍ التحميل…',
    loadMoreError: 'تعذّر تحميل المزيد من الأسهم',
  },
  stock: {
    loading: 'جارٍ تحميل السهم…',
    error: 'تعذّر تحميل هذا السهم',
    notFound: {
      title: 'السهم غير موجود',
      description: 'لا يوجد سهم بالرمز {{symbol}}.',
    },
    stats: {
      open: 'الافتتاح',
      high: 'الأعلى',
      low: 'الأدنى',
      previousClose: 'الإغلاق السابق',
      volume: 'حجم التداول',
    },
  },
  chart: {
    loading: 'جارٍ تحميل الرسم البياني…',
    empty: 'لا توجد بيانات لهذه الفترة',
    error: 'تعذّر تحميل الرسم البياني',
    custom: {
      label: 'مخصص',
      from: 'من',
      to: 'إلى',
      apply: 'تطبيق',
      problem: {
        invalid: 'أدخل تاريخَي البداية والنهاية',
        order: 'يجب ألا يكون تاريخ البداية بعد تاريخ النهاية',
        future: 'التواريخ المستقبلية غير متاحة',
        tooOld: 'التواريخ الأقدم من سنة غير متاحة',
      },
    },
    label: '{{symbol}}: رسم بياني للسعر، {{period}}',
    summary: {
      text: '{{period}}: من {{start}} إلى {{end}}، {{change}}. الأعلى {{high}}، الأدنى {{low}}.',
      up: 'ارتفاع {{value}}',
      down: 'انخفاض {{value}}',
      flat: 'دون تغيير',
    },
    period: {
      label: 'فترة الرسم البياني',
      '1D': 'اليوم الماضي',
      '1W': 'الأسبوع الماضي',
      '1M': 'الشهر الماضي',
      '3M': 'آخر 3 أشهر',
      '1Y': 'السنة الماضية',
    },
  },
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
