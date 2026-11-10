import { beforeAll, vi } from 'vitest';

// The SVG title contains the local render time
process.env.TZ = 'UTC';
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
});
