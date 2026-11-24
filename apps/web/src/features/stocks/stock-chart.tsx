import { DEFAULT_PERIOD, type Period, PERIOD_CONFIG } from '@nabd/shared';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../lib/theme/theme-hooks';
import { Button, Skeleton, StateMessage } from '../../shared/ui';
import { useLivePrice } from '../market-data';
import { applyLivePrice, toCandles, toVolumeBars } from './candles';
import { readChartColors } from './chart-colors';
import { useChartLoader } from './chart-context';
import { chartLocale } from './chart-locale';
import type { Candle, ChartPort } from './chart-port';
import { PeriodSwitcher } from './period-switcher';
import { useHistory } from './stock-queries';

/** A candlestick chart with volume, a period switcher, and the live price on the last candle. */
export function StockChart({ symbol }: { symbol: string }) {
  const { t, i18n } = useTranslation();
  const locale = chartLocale(i18n.resolvedLanguage);
  const loader = useChartLoader();
  const { resolved: theme } = useTheme();
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const history = useHistory(symbol, period);
  const live = useLivePrice(symbol);

  // The element is kept in state so effects run once it exists.
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [port, setPort] = useState<ChartPort | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const lastCandle = useRef<Candle | undefined>(undefined);
  // The latest locale, for the effect that creates the chart: a language change must update the
  // chart (below), not rebuild it, so the locale cannot be a dependency of that effect.
  const localeRef = useRef(locale);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    if (element === null) {
      return undefined;
    }
    let cancelled = false;
    let created: ChartPort | undefined;
    loader(element, readChartColors(getComputedStyle(element)), localeRef.current).then(
      (next) => {
        if (cancelled) {
          next.dispose();
          return;
        }
        created = next;
        setPort(next);
      },
      () => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      },
    );
    return () => {
      cancelled = true;
      created?.dispose();
      setPort(undefined);
    };
  }, [element, loader, attempt]);

  useEffect(() => {
    if (port === undefined || history.data === undefined) {
      return;
    }
    const candles = toCandles(history.data.points);
    lastCandle.current = candles.at(-1);
    port.setData(candles, toVolumeBars(history.data.points));
  }, [port, history.data]);

  useEffect(() => {
    if (port === undefined || history.data === undefined || live === undefined) {
      return;
    }
    const candle = applyLivePrice(lastCandle.current, {
      price: live.price,
      timestamp: live.timestamp,
      bucketMs: PERIOD_CONFIG[period].bucketMs,
    });
    lastCandle.current = candle;
    port.updateCandle(candle);
  }, [port, history.data, live, period]);

  useEffect(() => {
    if (port === undefined || element === null) {
      return;
    }
    port.applyColors(readChartColors(getComputedStyle(element)));
  }, [port, element, theme]);

  useEffect(() => {
    port?.applyLocale(locale);
  }, [port, locale]);

  const retry = (action: () => void) => <Button onClick={action}>{t('errors.retry')}</Button>;

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
      <div role="status" aria-busy="true" aria-label={t('chart.loading')}>
        <Skeleton className="block-80 inline-full" />
      </div>
    );
  } else if (history.isError && history.data === undefined) {
    overlay = (
      <StateMessage
        tone="error"
        title={t('chart.error')}
        action={retry(() => {
          void history.refetch();
        })}
      />
    );
  } else if (history.data.points.length === 0) {
    overlay = <StateMessage tone="empty" title={t('chart.empty')} />;
  }

  return (
    <section className="flex flex-col gap-3">
      <PeriodSwitcher value={period} onChange={setPeriod} />
      <div className="relative overflow-hidden rounded-lg border border-line bg-surface-raised p-2 shadow-raised">
        <div
          ref={setElement}
          role="img"
          dir="ltr"
          aria-label={t('chart.label', { symbol, period: t(`chart.period.${period}`) })}
          className="block-80 inline-full"
        />
        {overlay === null ? null : (
          <div className="absolute inset-0 bg-surface-raised">{overlay}</div>
        )}
      </div>
    </section>
  );
}
