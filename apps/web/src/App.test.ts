import { describe, expect, it } from 'vitest';
import { APP_STAGE } from './App';

describe('application metadata', () => {
  it('identifies the current milestone', () => {
    expect(APP_STAGE).toContain('M3');
  });
});
