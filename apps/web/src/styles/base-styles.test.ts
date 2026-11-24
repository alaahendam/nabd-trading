import { describe, expect, it } from 'vitest';

import indexCss from './index.css?raw';

/** The declarations inside the first block that starts with `selector` (nested blocks excluded). */
const block = (selector: string) => {
  const start = indexCss.indexOf(`${selector} {`);
  const end = indexCss.indexOf('}', start);
  return indexCss.slice(start, end);
};

describe('base styles', () => {
  it('STY-01 gives enabled buttons a pointer cursor, and leaves disabled ones alone', () => {
    expect(indexCss).toMatch(/button:not\(:disabled\)[^{]*\{[^}]*cursor:\s*pointer/);
    expect(indexCss).toMatch(/:disabled[^{]*\{[^}]*cursor:\s*not-allowed/);
  });

  it('STY-02 makes the numeric figure an inline box, so its parent places it in either direction', () => {
    const numeric = block('@utility numeric');
    expect(numeric).toContain('display: inline-block');
    expect(numeric).toContain('direction: ltr');
    expect(numeric).toContain('unicode-bidi: isolate');
    expect(numeric).toContain('tabular-nums');
  });
});
