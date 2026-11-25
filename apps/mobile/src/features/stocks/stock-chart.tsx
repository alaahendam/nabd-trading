import { useHistory } from '@nabd/data';
import { type Candle, summarizeHistory, toCandles, toVolumeBars } from '@nabd/domain';
import { changeDirection, formatPercentMagnitude, formatPrice } from '@nabd/i18n';
import { useLivePrice } from '@nabd/market-data';
import { DEFAULT_PERIOD, type Period } from '@nabd/shared';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../lib/theme/theme';
import { useTheme } from '../../lib/theme/theme-provider';
import { Button, Skeleton, StateMessage, Text } from '../../shared/ui';
import { chartColorsFor } from './chart-colors';
import { chartLocale } from './chart-locale';
import { useChartSurface } from './chart-surface-context';
import { PeriodSwitcher } from './period-switcher';
import { useLiveCandle } from './use-live-candle';

const CHART_HEIGHT = 320;
const noCandles: readonly Candle[] = [];

const styles = StyleSheet.create({
  section: { gap: spacing.medium },
  chart: { height: CHART_HEIGHT },
  overlay: { justifyContent: 'center' },
});

/**
 * A candlestick chart with volume, a period switcher, and the live price on the last candle. The
 * drawing is a WebView (ADR 0013), which a screen reader cannot read, so the numbers behind it are
 * said in text below: the period, where it started and ended, the change, the high and the low.
 */
export function StockChart({ symbol }: { symbol: string }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const renderSurface = useChartSurface();
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  const history = useHistory(symbol, period);
  const live = useLivePrice(symbol);

  const points = history.data?.points;
  const candles = useMemo(() => (points === undefined ? noCandles : toCandles(points)), [points]);
  const volume = useMemo(() => (points === undefined ? [] : toVolumeBars(points)), [points]);
  const liveCandle = useLiveCandle(candles, history.data?.bucketMs, live);
  const chartColors = useMemo(() => chartColorsFor(colors), [colors]);

  const periodName = t(`chart.period.${period}`);
  // Read from the loaded history, not from live ticks, so the text stays still while prices move.
  const summary = points === undefined ? undefined : summarizeHistory(points);
  const summaryText =
    summary === undefined
      ? undefined
      : t('chart.summary.text', {
          period: periodName,
          start: formatPrice(summary.start),
          end: formatPrice(summary.end),
          high: formatPrice(summary.high),
          low: formatPrice(summary.low),
          change: t(`chart.summary.${changeDirection(summary.changePercent)}`, {
            value: formatPercentMagnitude(summary.changePercent),
          }),
        });

  const retry = (action: () => void) => <Button label={t('errors.retry')} onPress={action} />;

  let overlay = null;
  if (loadFailed) {
    overlay = (
      <StateMessage
        tone="error"
        title={t('chart.error')}
        action={retry(() => {
          setLoadFailed(false);
          setAttempt((count) => count + 1);
        })}
      />
    );
  } else if (history.isPending) {
    overlay = (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={t('chart.loading')}
        style={[StyleSheet.absoluteFill, styles.overlay]}
      >
        <Skeleton width={320} height={CHART_HEIGHT} />
      </View>
    );
  } else if (points === undefined) {
    overlay = (
      <StateMessage
        tone="error"
        title={t('chart.error')}
        action={retry(() => {
          void history.refetch();
        })}
      />
    );
  } else if (points.length === 0) {
    overlay = <StateMessage tone="empty" title={t('chart.empty')} />;
  }

  return (
    <View style={styles.section}>
      <PeriodSwitcher value={period} onChange={setPeriod} />
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('chart.label', { symbol, period: periodName })}
        style={styles.chart}
      >
        {renderSurface({
          candles,
          volume,
          live: liveCandle,
          colors: chartColors,
          locale: chartLocale(i18n.resolvedLanguage),
          attempt,
          onLoadError: () => {
            setLoadFailed(true);
          },
        })}
        {overlay === null ? null : (
          <View
            style={[
              StyleSheet.absoluteFill,
              styles.overlay,
              { backgroundColor: colors.background },
            ]}
          >
            {overlay}
          </View>
        )}
      </View>
      {summaryText === undefined ? null : <Text>{summaryText}</Text>}
      <Text variant="muted">{t('attribution.chartNotice')}</Text>
    </View>
  );
}
