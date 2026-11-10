import { expect, test } from 'vitest';
import { getV1Redirect } from '../src/redirect.ts';

const redirect = (path: string) => getV1Redirect(new URL(path, 'https://cdn.venz.dev'));

test('redirects v1 image URLs to their v2 equivalent', () => {
  expect(redirect('/i/chart.png?type=bar&lp=n&w=800&label=a&label=b&l=x&l=y&data=1*2&data=3*4')).toBe(
    '/i/chart.png?type=bar&by=col&legend=none&row=a&row=b&col=x&col=y&data=1*2&data=3*4&w=800'
  );
  expect(redirect('/i/chart.svg?type=pivot&chrome=0&theme=light&data=1*2')).toBe(
    '/i/chart.svg?type=line&theme=light&data=1*2'
  );
  expect(redirect('/i/chart.svg?lp=tr&pivot=0')).toBe('/i/chart.svg');
});

test('does not redirect v2 image URLs', () => {
  expect(redirect('/i/chart.svg?type=bar&by=col&row=a&data=1*2')).toBeUndefined();
  expect(redirect('/i/chart.svg?type=line&labelY=y&data=1*2')).toBeUndefined();
});
