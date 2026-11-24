import { cva } from 'class-variance-authority';
import { useTranslation } from 'react-i18next';

/** The same four states as the realtime client; shared cannot import from features. */
export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

const dotVariants = cva('rounded-full block-2 inline-2', {
  variants: {
    status: {
      connected: 'bg-positive',
      connecting: 'bg-watch',
      reconnecting: 'bg-watch',
      offline: 'bg-negative',
    },
  },
});

export function ConnectionBadge({ status }: { status: ConnectionState }) {
  const { t } = useTranslation();
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-content">
      <span aria-hidden="true" className={dotVariants({ status })} />
      {t(`connection.${status}`)}
    </span>
  );
}
