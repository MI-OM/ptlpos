"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    constructor() {
        const url = process.env.REDIS_URL;
        if (!url) {
            return;
        }
        this.client = new ioredis_1.default(url, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
        });
        this.client.on('error', error => {
            this.logger.warn(`Redis unavailable: ${error.message}`);
        });
        void this.client.connect().catch((error) => {
            this.logger.warn(`Redis connection skipped: ${error.message}`);
        });
    }
    async get(key) {
        if (!this.client) {
            return null;
        }
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (!this.client) {
            return;
        }
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
            return;
        }
        await this.client.set(key, value);
    }
    async del(key) {
        if (!this.client) {
            return;
        }
        await this.client.del(key);
    }
    async getJSON(key) {
        const value = await this.get(key);
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    async setJSON(key, value, ttlSeconds) {
        const serialized = JSON.stringify(value);
        await this.set(key, serialized, ttlSeconds);
    }
    async invalidatePattern(pattern) {
        if (!this.client) {
            return;
        }
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map