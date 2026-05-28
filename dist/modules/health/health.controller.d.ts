import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    status(): {
        status: string;
        timestamp: string;
        service: string;
    };
}
