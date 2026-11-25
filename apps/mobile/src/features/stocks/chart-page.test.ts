import { toCandles, toVolumeBars } from '@nabd/domain';
import { aaplHistory } from '@nabd/testing';
import { resolveToken } from '@nabd/tokens';

import {
  colorsCommand,
  localeCommand,
  setDataCommand,
  updateCandleCommand,
} from './chart-commands';
import { buildChartPage, chartBridgeScript } from './chart-page';

const colors = {
  background: resolveToken('light', 'surface'),
  text: resolveToken('light', 'content-muted'),
  grid: resolveToken('light', 'line'),
  up: resolveToken('light', 'positive'),
  down: resolveToken('light', 'negative'),
};

/** Reads a command back: the page function it calls, and its arguments as JSON. */
function read(command: string) {
  const match = /^window\.nabd\.(\w+)\((.*)\);true;$/s.exec(command);
  if (match === null) {
    throw new Error(`Not a command of the page: ${command}`);
  }
  return { name: match[1], args: JSON.parse(`[${match[2]}]`) as unknown[] };
}

describe('the chart page', () => {
  it('CHT-13 holds the library inline and loads nothing from the network', () => {
    const page = buildChartPage('var LightweightCharts = {};');

    expect(page).toContain('var LightweightCharts = {};');
    expect(page).not.toMatch(/<script[^>]*\ssrc=/);
    expect(page).not.toMatch(/<link\b/);
    expect(page).not.toMatch(/https?:\/\//);
  });

  it('CHT-13 keeps a closing tag inside the library from ending its script', () => {
    const page = buildChartPage('var text = "</script>";');

    expect(page.match(/<\/script>/g)).toHaveLength(2);
  });

  it('CHT-13 has a bridge that says when it is ready, and loads nothing itself', () => {
    expect(chartBridgeScript).toContain("postMessage('ready')");
    expect(chartBridgeScript).not.toMatch(/https?:\/\//);
  });

  it('CHT-13 turns each command into one call of the page, with its data as JSON', () => {
    const candles = toCandles(aaplHistory.points);
    const volume = toVolumeBars(aaplHistory.points);
    const candle = { time: 1, open: 2, high: 3, low: 1, close: 2.5 };

    expect(read(setDataCommand(candles, volume))).toEqual({
      name: 'setData',
      args: [candles, volume],
    });
    expect(read(updateCandleCommand(candle))).toEqual({ name: 'updateCandle', args: [candle] });
    expect(read(colorsCommand(colors))).toEqual({ name: 'applyColors', args: [colors] });
    expect(read(localeCommand('ar-u-nu-latn'))).toEqual({
      name: 'applyLocale',
      args: ['ar-u-nu-latn'],
    });
  });

  it('CHT-13 keeps quotes and line breaks in a value from breaking the command', () => {
    const command = localeCommand('a"b\nc');

    expect(read(command).args).toEqual(['a"b\nc']);
    expect(command).not.toContain('\n');
  });
});
