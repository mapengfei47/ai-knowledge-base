import { describe, expect, it } from 'vitest';
import { redisConnectionFromUrl } from './redis-connection';

describe('redisConnectionFromUrl', () => {
  it('converts a Redis URL into BullMQ connection options', () => {
    expect(redisConnectionFromUrl('redis://localhost:6380')).toMatchObject({
      host: 'localhost',
      port: 6380,
    });
  });
});

