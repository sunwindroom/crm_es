import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataPermissionService } from './data-permission.service';
import { PermissionCacheService } from './permission-cache.service';
import { User, UserRole } from '../../modules/user/entities/user.entity';

describe('DataPermissionService', () => {
  let service: DataPermissionService;
  let userRepository: Repository<User>;
  let cacheService: PermissionCacheService;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCacheService = {
    getAccessibleUserIds: jest.fn(),
    setAccessibleUserIds: jest.fn(),
    getSuperiorIds: jest.fn(),
    setSuperiorIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataPermissionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: PermissionCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<DataPermissionService>(DataPermissionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    cacheService = module.get<PermissionCacheService>(PermissionCacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canAssignToUser', () => {
    it('总裁可以分配给任意用户', async () => {
      const ceoUser = { id: 'ceo-id', role: UserRole.CEO } as User;
      const targetUser = { id: 'target-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(ceoUser)
        .mockResolvedValueOnce(targetUser);

      const result = await service.canAssignToUser('ceo-id', 'target-id');
      expect(result).toBe(true);
    });

    it('管理员可以分配给任意用户', async () => {
      const adminUser = { id: 'admin-id', role: UserRole.ADMIN } as User;
      const targetUser = { id: 'target-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(adminUser)
        .mockResolvedValueOnce(targetUser);

      const result = await service.canAssignToUser('admin-id', 'target-id');
      expect(result).toBe(true);
    });

    it('CMO可以分配给销售相关角色', async () => {
      const cmoUser = { id: 'cmo-id', role: UserRole.CMO } as User;
      const salesManager = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(cmoUser)
        .mockResolvedValueOnce(salesManager);

      const result = await service.canAssignToUser('cmo-id', 'sm-id');
      expect(result).toBe(true);
    });

    it('CMO不能分配给非销售角色', async () => {
      const cmoUser = { id: 'cmo-id', role: UserRole.CMO } as User;
      const financeUser = { id: 'finance-id', role: UserRole.FINANCE } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(cmoUser)
        .mockResolvedValueOnce(financeUser);

      const result = await service.canAssignToUser('cmo-id', 'finance-id');
      expect(result).toBe(false);
    });

    it('销售经理可以分配给下属', async () => {
      const salesManager = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;
      const salesUser = { id: 'sales-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(salesManager)
        .mockResolvedValueOnce(salesUser);

      mockCacheService.getAccessibleUserIds.mockResolvedValue(['sm-id', 'sales-id']);

      const result = await service.canAssignToUser('sm-id', 'sales-id');
      expect(result).toBe(true);
    });

    it('销售人员不能分配客户', async () => {
      const salesUser = { id: 'sales-id', role: UserRole.SALES } as User;
      const targetUser = { id: 'target-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne
        .mockResolvedValueOnce(salesUser)
        .mockResolvedValueOnce(targetUser);

      const result = await service.canAssignToUser('sales-id', 'target-id');
      expect(result).toBe(false);
    });
  });

  describe('canManageCustomer', () => {
    it('总裁可以管理所有客户', async () => {
      const ceoUser = { id: 'ceo-id', role: UserRole.CEO } as User;

      mockUserRepository.findOne.mockResolvedValue(ceoUser);

      const result = await service.canManageCustomer('ceo-id', 'any-owner-id');
      expect(result).toBe(true);
    });

    it('CMO可以管理所有客户', async () => {
      const cmoUser = { id: 'cmo-id', role: UserRole.CMO } as User;

      mockUserRepository.findOne.mockResolvedValue(cmoUser);

      const result = await service.canManageCustomer('cmo-id', 'any-owner-id');
      expect(result).toBe(true);
    });

    it('客户负责人可以管理自己的客户', async () => {
      const salesUser = { id: 'sales-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne.mockResolvedValue(salesUser);

      const result = await service.canManageCustomer('sales-id', 'sales-id');
      expect(result).toBe(true);
    });

    it('上级可以管理下属的客户', async () => {
      const salesManager = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;

      mockUserRepository.findOne.mockResolvedValue(salesManager);
      mockCacheService.getSuperiorIds.mockResolvedValue(['sm-id']);

      const result = await service.canManageCustomer('sm-id', 'sales-id');
      expect(result).toBe(true);
    });
  });

  describe('getAssignableUserIds', () => {
    it('总裁返回null（可分配给所有人）', async () => {
      const ceoUser = { id: 'ceo-id', role: UserRole.CEO } as User;

      mockUserRepository.findOne.mockResolvedValue(ceoUser);

      const result = await service.getAssignableUserIds('ceo-id');
      expect(result).toBeNull();
    });

    it('CMO返回销售相关用户列表', async () => {
      const cmoUser = { id: 'cmo-id', role: UserRole.CMO } as User;
      const salesUsers = [
        { id: 'sm-id' },
        { id: 'sales-id' },
        { id: 'business-id' },
      ];

      mockUserRepository.findOne.mockResolvedValue(cmoUser);
      mockUserRepository.find.mockResolvedValue(salesUsers);

      const result = await service.getAssignableUserIds('cmo-id');
      expect(result).toEqual(['sm-id', 'sales-id', 'business-id']);
    });

    it('销售经理返回下属列表', async () => {
      const salesManager = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;

      mockUserRepository.findOne.mockResolvedValue(salesManager);
      mockCacheService.getAccessibleUserIds.mockResolvedValue(['sm-id', 'sales-id']);

      const result = await service.getAssignableUserIds('sm-id');
      expect(result).toEqual(['sm-id', 'sales-id']);
    });

    it('销售人员返回空数组', async () => {
      const salesUser = { id: 'sales-id', role: UserRole.SALES } as User;

      mockUserRepository.findOne.mockResolvedValue(salesUser);

      const result = await service.getAssignableUserIds('sales-id');
      expect(result).toEqual([]);
    });
  });
});
