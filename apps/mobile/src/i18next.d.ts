import type { defaultNS, resources } from '@nabd/i18n';

/** Types every `t()` call in the mobile app: keys come from the English resources. */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)['en'];
  }
}
