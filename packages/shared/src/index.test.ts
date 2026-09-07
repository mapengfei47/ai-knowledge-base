import { describe, expect, it } from 'vitest';
import { APP_NAME, SYSTEM_CHECK_QUEUE } from './index';

describe('shared constants', () => {
  it('exposes stable application and queue names', () => {
    expect(APP_NAME).toBe('AI Knowledge Base');
    expect(SYSTEM_CHECK_QUEUE).toBe('system-checks');
  });
});

