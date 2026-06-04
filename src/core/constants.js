export const TILE = 48;
export const VERSION = '0.4.0';

export function snap(value) {
  return Math.floor(value / TILE) * TILE + TILE / 2;
}
