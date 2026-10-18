import { Redis } from "@upstash/redis";

export function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis no está configurado.");
  }
  return Redis.fromEnv();
}
