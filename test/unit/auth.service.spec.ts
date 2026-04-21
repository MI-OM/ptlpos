import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/client';
import { AuthService } from '../../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('register', () => {
    it('should register new tenant and admin user successfully', async () => {
      const registerDto = {
        tenant: {
          name: 'Test Company',
          email: 'contact@testcompany.com',
          phone: '+1-800-TEST',
          website: 'https://testcompany.com',
        },
        user: {
          name: 'Test Admin',
          email: 'admin@testcompany.com',
          password: 'password123',
        },
      };

      const mockTenant = {
        id: mockTenantId,
        name: registerDto.tenant.name,
        email: registerDto.tenant.email,
        phone: registerDto.tenant.phone,
        website: registerDto.tenant.website,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRole = {
        id: 'admin-role-id',
        name: RoleName.ADMIN,
      };

      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        roleId: 'admin-role-id',
        name: registerDto.user.name,
        email: registerDto.user.email,
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTokens = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      };

      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation((callback) => {
        const tx = {
          tenant: {
            create: jest.fn().mockResolvedValue(mockTenant),
          },
          role: {
            findUnique: jest.fn().mockResolvedValue(mockRole),
          },
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
          },
        };
        return callback(tx);
      });

      (jwtService.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.register(registerDto);

      expect(mockPrisma.tenant.findFirst).toHaveBeenCalledWith({
        where: { name: registerDto.tenant.name },
      });
      expect(result).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          userId: mockUserId,
          tenantId: mockTenantId,
          role: RoleName.ADMIN,
          name: registerDto.user.name,
          email: registerDto.user.email,
        },
      });
    });

    it('should throw error if tenant already exists', async () => {
      const registerDto = {
        tenant: {
          name: 'Existing Company',
          email: 'contact@existing.com',
        },
        user: {
          name: 'Test Admin',
          email: 'admin@existing.com',
          password: 'password123',
        },
      };

      mockPrisma.tenant.findFirst.mockResolvedValue({ id: 'existing-tenant-id' });

      await expect(service.register(registerDto)).rejects.toThrow('Organization with this name already exists');
    });
  });

  describe('login', () => {
    it('should login user successfully and return tokens', async () => {
      const loginDto = {
        email: mockEmail,
        password: mockPassword,
        tenantId: mockTenantId,
      };

      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        roleId: 'admin-role-id',
        name: 'Test User',
        email: mockEmail,
        passwordHash: 'hashed-password',
        role: {
          name: RoleName.ADMIN,
        },
      };

      const mockTenant = {
        id: mockTenantId,
        name: 'Test Company',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock).mockReturnValue('mock-token');

      const result = await service.login(loginDto);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: {
          tenantId_email: {
            tenantId: loginDto.tenantId,
            email: loginDto.email,
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, 'hashed-password');
      expect(result).toEqual({
        access_token: 'mock-token',
        refresh_token: 'mock-token',
        user: {
          userId: mockUserId,
          tenantId: mockTenantId,
          role: RoleName.ADMIN,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'wrongpassword',
        tenantId: mockTenantId,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for wrong password', async () => {
      const loginDto = {
        email: mockEmail,
        password: 'wrongpassword',
        tenantId: mockTenantId,
      };

      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        roleId: 'admin-role-id',
        name: 'Test User',
        email: mockEmail,
        passwordHash: 'hashed-password',
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockPayload = {
        sub: mockUserId,
        tenantId: mockTenantId,
        role: RoleName.ADMIN,
        email: mockEmail,
      };

      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        roleId: 'admin-role-id',
        name: 'Test User',
        email: mockEmail,
        role: {
          name: RoleName.ADMIN,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.tenant.findUnique.mockResolvedValue({ id: mockTenantId });
      (jwtService.verify as jest.Mock).mockReturnValue(mockPayload);
      (jwtService.sign as jest.Mock).mockReturnValue('new-access-token');

      const result = await service.refresh(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken, 'jwt-secret');
      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-access-token',
        user: {
          userId: mockUserId,
          tenantId: mockTenantId,
          role: RoleName.ADMIN,
          name: mockUser.name,
          email: mockUser.email,
        },
      });
    });

    it('should throw error for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refresh(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('me', () => {
    it('should return current user profile', async () => {
      const authContext = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: RoleName.ADMIN,
      };

      const mockUser = {
        id: mockUserId,
        tenantId: mockTenantId,
        roleId: 'admin-role-id',
        name: 'Test User',
        email: mockEmail,
        role: {
          name: RoleName.ADMIN,
        },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.me(authContext);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
        include: { role: true },
      });
      expect(result).toEqual({
        id: mockUserId,
        name: mockUser.name,
        email: mockUser.email,
        tenantId: mockTenantId,
        role: { name: RoleName.ADMIN },
      });
    });
  });
});
