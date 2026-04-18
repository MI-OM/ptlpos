import { HealthService } from 'src/modules/health/health.service';

describe('HealthService', () => {
  it('returns a healthy status payload', () => {
    const service = new HealthService();

    const result = service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.service).toBe('ptlpos-api');
    expect(typeof result.timestamp).toBe('string');
  });
});
