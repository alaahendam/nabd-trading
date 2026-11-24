import type { ReactNode } from 'react';

interface StateMessageProps {
  tone: 'empty' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}

/** The empty and the failed state of a screen. An error is announced, an empty state is polite. */
export function StateMessage({ tone, title, description, action }: StateMessageProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface-raised p-6"
    >
      <p className="text-lg font-semibold">{title}</p>
      {description === undefined ? null : <p className="text-content-muted">{description}</p>}
      {action}
    </div>
  );
}
