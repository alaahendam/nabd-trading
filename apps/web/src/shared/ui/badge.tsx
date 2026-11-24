import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken text-content',
        positive: 'bg-positive-subtle text-positive',
        negative: 'bg-negative-subtle text-negative',
        watch: 'border border-line bg-surface-raised text-watch',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={badgeVariants({ tone, className })} {...props} />;
}
