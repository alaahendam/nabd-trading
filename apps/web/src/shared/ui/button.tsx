import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-brand hover:opacity-90',
        secondary:
          'border border-line-strong bg-surface-raised text-content hover:bg-surface-sunken',
        ghost: 'text-content hover:bg-surface-sunken',
      },
      size: {
        md: 'px-4 text-sm min-block-11',
        sm: 'px-3 text-sm min-block-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button type="button" className={buttonVariants({ variant, size, className })} {...props} />
  );
}
