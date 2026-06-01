export const TILE = 48;
export const VERSION = '0.2.0-dev';

export function snap(value) {
  return Math.floor(value / TILE) * TILE + TILE / 2;
}
