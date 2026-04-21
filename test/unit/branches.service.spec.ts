import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@prisma/client';
import { BranchesService } from '../../src/modules/branches/branches.service';
import { CreateBranchDto, UpdateBranchDto } from '../../src/modules/branches/dto/create-branch.dto';
import { RoleName } from '@prisma/client';

describe('BranchesService', () => {
  let service: BranchesService;
  let prisma: PrismaService;

  const mockPrisma = {
    branch: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  const mockTenantId = 'test-tenant-id';
  const mockUserId = 'test-user-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a branch successfully', async () => {
      const createDto: CreateBranchDto = {
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
      };

      const expectedBranch = {
        id: 'test-branch-id',
        tenantId: mockTenantId,
        name: createDto.name,
        address: createDto.address,
        city: createDto.city,
        state: createDto.state,
        zipCode: createDto.zipCode,
        country: createDto.country,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.branch.create.mockResolvedValue(expectedBranch);

      const result = await service.create(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        createDto
      );

      expect(mockPrisma.branch.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          ...createDto,
        },
      });
      expect(result).toEqual(expectedBranch);
    });

    it('should throw error when user is not admin or manager', async () => {
      const createDto: CreateBranchDto = {
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
      };

      await expect(
        service.create(
          { tenantId: mockTenantId, userId: mockUserId, role: RoleName.SALES_REP },
          createDto
        )
      ).rejects.toThrow('Only ADMIN or MANAGER can create branches');
    });
  });

  describe('findAll', () => {
    it('should return all branches for tenant', async () => {
      const expectedBranches = [
        {
          id: 'branch-1',
          tenantId: mockTenantId,
          name: 'Branch 1',
          address: 'Address 1',
          city: 'City 1',
          state: 'State 1',
          zipCode: '11111',
          country: 'Country 1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'branch-2',
          tenantId: mockTenantId,
          name: 'Branch 2',
          address: 'Address 2',
          city: 'City 2',
          state: 'State 2',
          zipCode: '22222',
          country: 'Country 2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.branch.findMany.mockResolvedValue(expectedBranches);

      const result = await service.findAll({ tenantId: mockTenantId });

      expect(mockPrisma.branch.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(expectedBranches);
    });
  });

  describe('findOne', () => {
    it('should return a branch by id', async () => {
      const branchId = 'test-branch-id';
      const expectedBranch = {
        id: branchId,
        tenantId: mockTenantId,
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.branch.findUnique.mockResolvedValue(expectedBranch);

      const result = await service.findOne({ tenantId: mockTenantId }, branchId);

      expect(mockPrisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: branchId, tenantId: mockTenantId },
      });
      expect(result).toEqual(expectedBranch);
    });

    it('should return null when branch not found', async () => {
      const branchId = 'non-existent-branch-id';

      mockPrisma.branch.findUnique.mockResolvedValue(null);

      const result = await service.findOne({ tenantId: mockTenantId }, branchId);

      expect(mockPrisma.branch.findUnique).toHaveBeenCalledWith({
        where: { id: branchId, tenantId: mockTenantId },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a branch successfully', async () => {
      const branchId = 'test-branch-id';
      const updateDto: UpdateBranchDto = {
        name: 'Updated Branch Name',
        address: 'Updated Address',
        city: 'Updated City',
        state: 'Updated State',
        zipCode: '54321',
        country: 'Updated Country',
      };

      const expectedBranch = {
        id: branchId,
        tenantId: mockTenantId,
        name: updateDto.name,
        address: updateDto.address,
        city: updateDto.city,
        state: updateDto.state,
        zipCode: updateDto.zipCode,
        country: updateDto.country,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.branch.update.mockResolvedValue(expectedBranch);

      const result = await service.update(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        branchId,
        updateDto
      );

      expect(mockPrisma.branch.update).toHaveBeenCalledWith({
        where: { id: branchId, tenantId: mockTenantId },
        data: updateDto,
      });
      expect(result).toEqual(expectedBranch);
    });

    it('should throw error when user is not admin or manager', async () => {
      const branchId = 'test-branch-id';
      const updateDto: UpdateBranchDto = {
        name: 'Updated Branch Name',
      };

      await expect(
        service.update(
          { tenantId: mockTenantId, userId: mockUserId, role: RoleName.SALES_REP },
          branchId,
          updateDto
        )
      ).rejects.toThrow('Only ADMIN or MANAGER can update branches');
    });
  });

  describe('delete', () => {
    it('should delete a branch successfully', async () => {
      const branchId = 'test-branch-id';
      const expectedBranch = {
        id: branchId,
        tenantId: mockTenantId,
        name: 'Test Branch',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'Test Country',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.branch.delete.mockResolvedValue(expectedBranch);

      const result = await service.delete(
        { tenantId: mockTenantId, userId: mockUserId, role: RoleName.ADMIN },
        branchId
      );

      expect(mockPrisma.branch.delete).toHaveBeenCalledWith({
        where: { id: branchId, tenantId: mockTenantId },
      });
      expect(result).toEqual(expectedBranch);
    });

    it('should throw error when user is not admin', async () => {
      const branchId = 'test-branch-id';

      await expect(
        service.delete(
          { tenantId: mockTenantId, userId: mockUserId, role: RoleName.MANAGER },
          branchId
        )
      ).rejects.toThrow('Only ADMIN can delete branches');
    });
  });
});
