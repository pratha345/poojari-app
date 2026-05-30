// src/utils/redis.js — Redis client with silent fallback (cache miss on error)
'use strict';

let redis = null;

try {
  const Redis = require('ioredis');
  redis = new Redis({
    host:              process.env.REDIS_HOST     || '127.0.0.1',
    port:              parseInt(process.env.REDIS_PORT || '6379'),
    password:          process.env.REDIS_PASSWORD || undefined,
    db:                0,
    lazyConnect:       true,
    enableOfflineQueue: false,
    retryStrategy:     (times) => (times > 3 ? null : Math.min(times * 500, 2000)),
    maxRetriesPerRequest: 1,
    connectTimeout:    2000,
    commandTimeout:    1000,
  });

  redis.on('error', () => {}); // silence connection errors — app continues without cache
  redis.connect().catch(() => {});
} catch (_) {
  redis = null; // ioredis not installed — no-op
}

// Get a cached value; returns null on miss or error
async function getCache(key) {
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (_) {
    return null;
  }
}

// Set a value with TTL in seconds
async function setCache(key, data, ttlSeconds) {
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (_) {}
}

// Delete one or more keys (supports wildcard via SCAN + DEL)
async function delCache(...keys) {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch (_) {}
}

// Delete all keys matching a pattern (e.g. 'pooja:list:*')
async function delCachePattern(pattern) {
  if (!redis) return;
  try {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length) await redis.del(...keys);
    } while (cursor !== '0');
  } catch (_) {}
}

module.exports = { getCache, setCache, delCache, delCachePattern };
