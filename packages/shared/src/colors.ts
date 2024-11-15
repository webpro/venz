import type { IncomingSeries } from './types';

export const COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
  '#6366f1',
  '#f43f5e',
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#eab308',
];

export const getNextAvailableColor = (existingSeries: IncomingSeries[] = []) => {
  const nextColorIndex = existingSeries.length % COLORS.length;
  return COLORS[nextColorIndex];
};
