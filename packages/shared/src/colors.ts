import type { IncomingSeries } from './types.ts';

export const C0 = '#4e79a7';
export const C1 = '#f28e2c';
export const C2 = '#e15759';
export const C3 = '#76b7b2';
export const C4 = '#59a14f';
export const C5 = '#edc949';
export const C6 = '#af7aa1';
export const C7 = '#ff9da7';
export const C8 = '#9c755f';
export const C9 = '#bab0ab';

export const COLORS = [C0, C1, C2, C3, C4, C5, C6, C7, C8, C9];

export const getNextAvailableColor = (existingSeries: IncomingSeries[] = []) => {
  const nextColorIndex = existingSeries.length % COLORS.length;
  return COLORS[nextColorIndex];
};
