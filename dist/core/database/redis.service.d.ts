import { OnModuleDestroy } from '@nestjs/common';
export declare class RedisService implements OnModuleDestroy {
    private readonly logger;
    private readonly client?;
    constructor();
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    getJSON<T>(key: string): Promise<T | null>;
    setJSON(key: string, value: any, ttlSeconds?: number): Promise<void>;
    invalidatePattern(pattern: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
