import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: { sign: jest.Mock; verify: jest.Mock };

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      tenant: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      verificationToken: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    service = new AuthService(prisma as never, jwtService as unknown as JwtService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers a new organization and admin user', async () => {
      prisma.user.findFirst.mockResolvedValue(null as any);
      prisma.tenant.create.mockResolvedValue({ id: mockTenantId, name: 'Test Company' } as any);
      prisma.tenant.findUnique.mockResolvedValue({ id: mockTenantId, name: 'Test Company' } as any);
      prisma.role.findUnique.mockResolvedValue({ id: 'role-1', name: RoleName.ADMIN } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue({
        id: mockUserId,
        tenantId: mockTenantId,
        name: 'Test Admin',
        email: 'admin@testcompany.com',
        role: { name: RoleName.ADMIN },
      } as any);
      prisma.verificationToken.deleteMany.mockResolvedValue({ count: 0 } as any);
      prisma.verificationToken.create.mockResolvedValue({
        token: 'verify-token',
        expiresAt: new Date('2026-06-01T00:00:00.000Z'),
      } as any);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.register({
        organizationName: 'Test Company',
        name: 'Test Admin',
        email: 'admin@testcompany.com',
        password: 'password123',
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'admin@testcompany.com' },
      });
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: { name: 'Test Company' },
      });
      expect(result.access_token).toBe('mock-token');
      expect(result.refresh_token).toBe('mock-token');
      expect(result.tenant).toEqual({
        id: mockTenantId,
        name: 'Test Company',
      });
      expect(result.user).toEqual({
        userId: mockUserId,
        tenantId: mockTenantId,
        role: RoleName.ADMIN,
        name: 'Test Admin',
        email: 'admin@testcompany.com',
      });
      expect(result.emailVerification).toEqual(
        expect.objectContaining({
          email: 'admin@testcompany.com',
          message: 'Verification token sent. Check your email.',
          expiresAt: expect.any(Date),
          token: expect.any(String),
        }),
      );
    });

    it('rejects duplicate email registration', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(
        service.register({
          organizationName: 'Existing Company',
          name: 'Test Admin',
          email: 'admin@existing.com',
          password: 'password123',
        }),
      ).rejects.toThrow('already registered');
    });
  });

  describe('login', () => {
    it('logs in a user and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        tenantId: mockTenantId,
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: { name: RoleName.ADMIN },
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
        tenantId: mockTenantId,
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: mockTenantId,
            email: 'test@example.com',
          },
        },
        include: {
          role: true,
        },
      });
      expect(result.user).toEqual({
        userId: mockUserId,
        tenantId: mockTenantId,
        role: RoleName.ADMIN,
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('rejects invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null as any);

      await expect(
        service.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
          tenantId: mockTenantId,
        }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('refreshes tokens successfully', async () => {
      jwtService.verify.mockReturnValue({
        sub: mockUserId,
        tenantId: mockTenantId,
      });
      prisma.user.findFirst.mockResolvedValue({
        id: mockUserId,
        tenantId: mockTenantId,
        name: 'Test User',
        email: 'test@example.com',
        role: { name: RoleName.ADMIN },
      } as any);
      jwtService.sign.mockReturnValue('new-token');

      const result = await service.refresh('valid-refresh-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual({
        access_token: 'new-token',
        refresh_token: 'new-token',
        user: {
          userId: mockUserId,
          tenantId: mockTenantId,
          role: RoleName.ADMIN,
          name: 'Test User',
          email: 'test@example.com',
        },
      });
    });

    it('rejects invalid refresh token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh('invalid-refresh-token')).rejects.toThrow(
        'Invalid or expired refresh token',
      );
    });
  });

  describe('me', () => {
    it('returns current user profile', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
        tenantId: mockTenantId,
        role: { name: RoleName.ADMIN },
      } as any);

      const result = await service.me({
        userId: mockUserId,
        tenantId: mockTenantId,
        role: RoleName.ADMIN,
      });

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockUserId,
          tenantId: mockTenantId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          tenantId: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });
      expect(result).toEqual({
        id: mockUserId,
        name: 'Test User',
        email: 'test@example.com',
        tenantId: mockTenantId,
        role: { name: RoleName.ADMIN },
      });
    });
  });
});
