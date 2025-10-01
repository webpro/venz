import { expect } from 'vitest';

export const matchRawTitle = expect.stringMatching(/Raw data input \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/);

export const matchLabeledTitle = expect.stringMatching(/New labeled data series \(\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}\)/);
