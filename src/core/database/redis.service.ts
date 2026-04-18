import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client?: Redis;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      return;
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    this.client.on('error', error => {
      this.logger.warn(`Redis unavailable: ${error.message}`);
    });

    void this.client.connect().catch((error: Error) => {
      this.logger.warn(`Redis connection skipped: ${error.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client) {
      return;
    }

    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client) {
      return;
    }

    await this.client.del(key);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }
}
