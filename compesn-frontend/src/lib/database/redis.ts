import { env } from "@/environment";
import Redis from "ioredis";

export const redis = env.ENABLE_CACHE ? new Redis(env.REDIS_URL) : null;
