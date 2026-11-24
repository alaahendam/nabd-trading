import { describe, expect, it, vi } from 'vitest';

import type { ChartColors, ChartPort } from './chart-port';

const port: ChartPort = {
  setData: vi.fn(),
  updateCandle: vi.fn(),
  applyColors: vi.fn(),
  dispose: vi.fn(),
};
const createLightweightChart = vi.fn(() => port);

vi.mock('./lightweight-chart-adapter', () => ({ createLightweightChart }));

const { loadLightweightChart } = await import('./chart-loader');

const colors: ChartColors = { background: 'a', text: 'b', grid: 'c', up: 'd', down: 'e' };

describe('loadLightweightChart', () => {
  it('ADP-06 imports the adapter on demand and makes a port with it', async () => {
    const container = document.createElement('div');
    await expect(loadLightweightChart(container, colors)).resolves.toBe(port);
    expect(createLightweightChart).toHaveBeenCalledWith(container, colors);
  });
});
