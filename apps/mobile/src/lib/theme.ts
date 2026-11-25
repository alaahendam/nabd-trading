import { resolveToken } from '@nabd/tokens';

/**
 * The look of the shell: light only for now, with colors from the shared tokens (never literals).
 * Light, dark and system, persisted, come in M2.
 */
export const theme = {
  colors: {
    background: resolveToken('light', 'surface'),
    text: resolveToken('light', 'content'),
    muted: resolveToken('light', 'content-muted'),
  },
  spacing: { small: 8, medium: 16, large: 24 },
  fontSize: { body: 16, title: 22 },
} as const;
