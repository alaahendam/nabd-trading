/**
 * The chart inside the page, mirroring the web chart (`lightweight-chart-adapter.ts`): candles,
 * volume under them, the TradingView attribution logo on. It tells the app it is ready, because
 * the app must not send anything before `window.nabd` exists.
 */
export const chartBridgeScript = `
var chart = LightweightCharts.createChart(document.getElementById('chart'), {
  autoSize: true,
  layout: { attributionLogo: true },
  rightPriceScale: { borderVisible: false },
  timeScale: { borderVisible: false, timeVisible: true }
});
var candles = chart.addSeries(LightweightCharts.CandlestickSeries, { borderVisible: false });
var volume = chart.addSeries(LightweightCharts.HistogramSeries, {
  priceFormat: { type: 'volume' },
  priceScaleId: ''
});
volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
var bars = [];
var colors = null;

function paintVolume() {
  volume.setData(bars.map(function (bar) {
    var color = colors === null ? undefined : bar.direction === 'up' ? colors.up : colors.down;
    return { time: bar.time, value: bar.value, color: color };
  }));
}

window.nabd = {
  setData: function (data, volumeBars) {
    bars = volumeBars;
    candles.setData(data);
    paintVolume();
    chart.timeScale().fitContent();
  },
  updateCandle: function (candle) {
    candles.update(candle);
  },
  applyColors: function (next) {
    colors = next;
    document.body.style.background = next.background;
    chart.applyOptions({
      layout: { textColor: next.text, background: { type: 'solid', color: next.background } },
      grid: { vertLines: { color: next.grid }, horzLines: { color: next.grid } }
    });
    candles.applyOptions({
      upColor: next.up, downColor: next.down, wickUpColor: next.up, wickDownColor: next.down
    });
    paintVolume();
  },
  applyLocale: function (locale) {
    chart.applyOptions({ localization: { locale: locale } });
  }
};
window.ReactNativeWebView.postMessage('ready');
`;

/** The whole page. The library is inline so the chart works with no network. */
export function buildChartPage(librarySource: string): string {
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">',
    '<style>html,body,#chart{margin:0;padding:0;width:100%;height:100%;overflow:hidden}</style>',
    '</head><body><div id="chart"></div>',
    // A closing tag inside the library would end the script early.
    `<script>${librarySource.replaceAll('</script', String.raw`<\/script`)}</script>`,
    `<script>${chartBridgeScript}</script>`,
    '</body></html>',
  ].join('');
}
