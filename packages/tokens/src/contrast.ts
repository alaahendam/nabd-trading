/** WCAG 2.x relative luminance and contrast ratio, for checking the design tokens. */

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.039_28 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const digits = hex.replace('#', '');
  const full = digits.length === 3 ? Array.from(digits, (digit) => digit + digit).join('') : digits;
  const value = Number.parseInt(full, 16);
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}
