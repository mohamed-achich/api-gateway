import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { User, UserSession } from '../entities/user.entity';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
      tls: this.configService.get('REDIS_TLS') === 'true' ? {} : undefined,
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  // User session management
  async saveRefreshToken(userId: number | string, token: string): Promise<void> {
    const key = `refresh:${userId}`;
    await this.redisClient.set(key, token);
    // Set expiration to 7 days to match JWT refresh token expiration
    await this.redisClient.expire(key, 7 * 24 * 60 * 60);
  }

  async getRefreshToken(userId: number | string): Promise<string | null> {
    const key = `refresh:${userId}`;
    return await this.redisClient.get(key);
  }

  async removeRefreshToken(userId: number | string): Promise<void> {
    const key = `refresh:${userId}`;
    await this.redisClient.del(key);
  }

  async saveSession(session: UserSession): Promise<void> {
    const key = `session:${session.userId}`;
    await this.redisClient.hmset(key, {
      userId: session.userId,
      username: session.username,
      roles: JSON.stringify(session.roles),
      exp: session.exp,
      accessToken: session.accessToken,
    });
    // Calculate TTL based on expiration time
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(1, session.exp - now);
    await this.redisClient.expire(key, ttl);
  }

  async getSession(userId: number | string): Promise<UserSession | null> {
    const key = `session:${userId}`;
    const session = await this.redisClient.hgetall(key);
    
    if (!Object.keys(session).length) {
      return null;
    }

    return {
      userId: session.userId,
      username: session.username,
      roles: JSON.parse(session.roles),
      exp: parseInt(session.exp),
      accessToken: session.accessToken,
    };
  }

  async removeSession(userId: number | string): Promise<void> {
    const key = `session:${userId}`;
    await this.redisClient.del(key);
  }

  // Token blacklisting
  async addToBlacklist(token: string, exp: number): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const ttl = Math.max(1, exp - now);
    await this.redisClient.set(`blacklist:${token}`, '1', 'EX', ttl);
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const exists = await this.redisClient.exists(`blacklist:${token}`);
    return exists === 1;
  }

  // Cache management
  async set(key: string, value: string, expiration?: number): Promise<void> {
    if (expiration) {
      await this.redisClient.set(key, value, 'EX', expiration);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.redisClient.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.redisClient.hget(key, field);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.redisClient.hdel(key, field);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }
}
