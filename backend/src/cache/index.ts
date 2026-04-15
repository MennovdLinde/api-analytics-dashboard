import Redis from 'ioredis';
import { env } from '../config/env';

export const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
redis.on('error', (err) => console.error('Redis error:', err));

export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds);
  return result;
}
