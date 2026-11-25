import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { theme } from '../../../lib/theme';

type Variant = 'body' | 'title' | 'muted';

interface Props extends TextProps {
  variant?: Variant;
}

/** The app's text: the theme's color and size, so no screen styles text by itself. */
export function Text({ variant = 'body', style, ...rest }: Props) {
  return <NativeText {...rest} style={[styles[variant], style]} />;
}

const styles = StyleSheet.create({
  body: { color: theme.colors.text, fontSize: theme.fontSize.body },
  title: { color: theme.colors.text, fontSize: theme.fontSize.title, fontWeight: '600' },
  muted: { color: theme.colors.muted, fontSize: theme.fontSize.body },
});
