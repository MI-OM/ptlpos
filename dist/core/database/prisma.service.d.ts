import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient {
    constructor();
    enableShutdownHooks(app: INestApplication): Promise<void>;
}
