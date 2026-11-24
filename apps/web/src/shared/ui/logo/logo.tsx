import { useTranslation } from 'react-i18next';

/**
 * The mark is a heartbeat line that turns into a rising chart, on a rounded badge in the brand
 * color. It uses the semantic tokens, so it follows light and dark. The mark is decorative; the
 * name next to it is what assistive technology reads.
 */
export function Logo() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 32 32"
        className="shrink-0 block-8 inline-8"
      >
        <rect width="32" height="32" rx="8" className="fill-brand" />
        <path
          d="M4 19h5l3-8 4 12 3-7 2 2 5-9"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-on-brand"
        />
      </svg>
      <span className="text-xl font-bold tracking-tight text-brand">{t('app.name')}</span>
    </span>
  );
}
