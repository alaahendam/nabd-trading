import { useMemo } from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

import { fontFamily } from '../../../lib/fonts';
import { fontSize } from '../../../lib/theme/theme';
import { useTheme } from '../../../lib/theme/theme-provider';

type Variant = 'body' | 'title' | 'muted';

interface Props extends TextProps {
  variant?: Variant;
}

/** The app's text: the theme's color, font and size, so no screen styles text by itself. */
export function Text({ variant = 'body', style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { color: colors.text, fontSize: fontSize.body, fontFamily: fontFamily.regular },
        title: { color: colors.text, fontSize: fontSize.title, fontFamily: fontFamily.semibold },
        muted: { color: colors.muted, fontSize: fontSize.body, fontFamily: fontFamily.regular },
      }),
    [colors],
  );
  return <NativeText {...rest} style={[styles[variant], style]} />;
}
