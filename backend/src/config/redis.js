const Redis = require('ioredis');
const logger = require('./logger');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    // Slower retry strategy to avoid spamming the console
    if (times > 10) return null; // Stop retrying after 10 attempts in dev
    const delay = Math.min(times * 1000, 10000); // Wait up to 10s between retries
    return delay;
  },
  maxRetriesPerRequest: 1,
});

let isRedisConnected = false;

redisClient.on('connect', () => {
  isRedisConnected = true;
  logger.info('Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error(`Redis connection error: ${err.message}`);
});

redisClient.on('reconnecting', () => {
  isRedisConnected = false;
  logger.warn('Redis reconnecting...');
});

// Cache helper functions
const cache = {
  async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error(`Cache set error: ${error.message}`);
      return false;
    }
  },

  async del(key) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache delete error: ${error.message}`);
      return false;
    }
  },

  async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error(`Cache delete pattern error: ${error.message}`);
      return false;
    }
  },

  async exists(key) {
    try {
      return await redisClient.exists(key);
    } catch (error) {
      logger.error(`Cache exists error: ${error.message}`);
      return false;
    }
  },

  async ttl(key) {
    try {
      return await redisClient.ttl(key);
    } catch (error) {
      logger.error(`Cache TTL error: ${error.message}`);
      return -1;
    }
  }
};

module.exports = { redisClient, cache, isRedisAvailable: () => isRedisConnected };
