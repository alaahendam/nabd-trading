import { clsx } from 'clsx';

/** A placeholder block that holds the layout of content that is still loading. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse rounded-md bg-surface-sunken', className)}
    />
  );
}
