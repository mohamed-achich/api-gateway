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
    });
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async saveUser(user: User): Promise<void> {
    const key = `user:${user.username}`;
    await this.redisClient.hmset(key, {
      id: user.id,
      username: user.username,
      password: user.password,
      roles: JSON.stringify(user.roles),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    });
  }

  async getUser(username: string): Promise<User | null> {
    const key = `user:${username}`;
    const user = await this.redisClient.hgetall(key);
    
    if (!Object.keys(user).length) {
      return null;
    }

    return {
      id: parseInt(user.id),
      username: user.username,
      password: user.password,
      roles: JSON.parse(user.roles),
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async saveSession(session: UserSession): Promise<void> {
    const key = `session:${session.userId}`;
    await this.redisClient.hmset(key, {
      userId: session.userId,
      username: session.username,
      roles: JSON.stringify(session.roles),
      exp: session.exp,
    });
    await this.redisClient.expire(key, 3600); // 1 hour expiration
  }

  async getSession(userId: number): Promise<UserSession | null> {
    const key = `session:${userId}`;
    const session = await this.redisClient.hgetall(key);
    
    if (!Object.keys(session).length) {
      return null;
    }

    return {
      userId: parseInt(session.userId),
      username: session.username,
      roles: JSON.parse(session.roles),
      exp: parseInt(session.exp),
    };
  }

  async removeSession(userId: number): Promise<void> {
    const key = `session:${userId}`;
    await this.redisClient.del(key);
  }
}
