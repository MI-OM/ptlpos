import { RolesService } from 'src/modules/roles/roles.service';

describe('RolesService', () => {
  it('lists roles in creation order', async () => {
    const prisma = {
      role: {
        findMany: jest.fn().mockResolvedValue([{ name: 'ADMIN' }, { name: 'MANAGER' }]),
      },
    };
    const service = new RolesService(prisma as never);

    const result = await service.findAll();

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'asc',
      },
    });
    expect(result).toEqual([{ name: 'ADMIN' }, { name: 'MANAGER' }]);
  });
});
