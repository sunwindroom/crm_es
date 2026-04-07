import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { Customer } from './entities/customer.entity';
import { Contact } from './entities/contact.entity';
import { CustomerVisit } from './entities/customer-visit.entity';
import { User, UserRole } from '../user/entities/user.entity';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: Repository<Customer>;
  let userRepository: Repository<User>;
  let dataPermissionService: DataPermissionService;

  const mockCustomerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockContactRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockVisitRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockDataPermissionService = {
    isSalesRole: jest.fn(),
    canAssignToUser: jest.fn(),
    getAccessibleUserIds: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Contact),
          useValue: mockContactRepository,
        },
        {
          provide: getRepositoryToken(CustomerVisit),
          useValue: mockVisitRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataPermissionService,
          useValue: mockDataPermissionService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    dataPermissionService = module.get<DataPermissionService>(DataPermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('CMO可以创建客户', async () => {
      const dto = { name: '测试客户' };
      const customer = { id: 'customer-id', ...dto };

      mockDataPermissionService.isSalesRole.mockResolvedValue(true);
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customer);
      mockCustomerRepository.save.mockResolvedValue(customer);
      mockCustomerRepository.findOne.mockResolvedValue(customer);

      const result = await service.create(dto, 'cmo-id');
      expect(mockDataPermissionService.isSalesRole).toHaveBeenCalledWith('cmo-id');
    });

    it('销售经理可以创建客户', async () => {
      const dto = { name: '测试客户' };
      const customer = { id: 'customer-id', ...dto };

      mockDataPermissionService.isSalesRole.mockResolvedValue(true);
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customer);
      mockCustomerRepository.save.mockResolvedValue(customer);

      await service.create(dto, 'sm-id');
      expect(mockDataPermissionService.isSalesRole).toHaveBeenCalledWith('sm-id');
    });

    it('非销售角色创建客户返回403', async () => {
      const dto = { name: '测试客户' };

      mockDataPermissionService.isSalesRole.mockResolvedValue(false);

      await expect(service.create(dto, 'finance-id')).rejects.toThrow(ForbiddenException);
    });

    it('指定负责人时检查分配权限', async () => {
      const dto = { name: '测试客户', ownerId: 'sales-id' };
      const customer = { id: 'customer-id', ...dto };

      mockDataPermissionService.isSalesRole.mockResolvedValue(true);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(true);
      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customer);
      mockCustomerRepository.save.mockResolvedValue(customer);

      await service.create(dto, 'cmo-id');
      expect(mockDataPermissionService.canAssignToUser).toHaveBeenCalledWith('cmo-id', 'sales-id');
    });

    it('无权分配时抛出ForbiddenException', async () => {
      const dto = { name: '测试客户', ownerId: 'target-id' };

      mockDataPermissionService.isSalesRole.mockResolvedValue(true);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(false);

      await expect(service.create(dto, 'sales-id')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('assign', () => {
    it('总裁可以将客户分配给任意用户', async () => {
      const customer = { id: 'customer-id', ownerId: 'old-owner' } as Customer;
      const targetUser = { id: 'target-id', role: UserRole.SALES } as User;
      const ceoUser = { id: 'ceo-id', role: UserRole.CEO } as User;

      mockCustomerRepository.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce({ ...customer, ownerId: 'target-id' });
      mockUserRepository.findOne
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(ceoUser);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(true);
      mockCustomerRepository.save.mockResolvedValue(customer);

      const result = await service.assign('customer-id', 'target-id', 'ceo-id');
      expect(mockDataPermissionService.canAssignToUser).toHaveBeenCalledWith('ceo-id', 'target-id');
    });

    it('CMO可以将客户分配给销售经理', async () => {
      const customer = { id: 'customer-id', ownerId: 'old-owner' } as Customer;
      const targetUser = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;
      const cmoUser = { id: 'cmo-id', role: UserRole.CMO } as User;

      mockCustomerRepository.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce({ ...customer, ownerId: 'sm-id' });
      mockUserRepository.findOne
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(cmoUser);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(true);
      mockCustomerRepository.save.mockResolvedValue(customer);

      await service.assign('customer-id', 'sm-id', 'cmo-id');
      expect(mockDataPermissionService.canAssignToUser).toHaveBeenCalledWith('cmo-id', 'sm-id');
    });

    it('销售经理可以将客户分配给下属', async () => {
      const customer = { id: 'customer-id', ownerId: 'old-owner' } as Customer;
      const targetUser = { id: 'sales-id', role: UserRole.SALES } as User;
      const smUser = { id: 'sm-id', role: UserRole.SALES_MANAGER } as User;

      mockCustomerRepository.findOne
        .mockResolvedValueOnce(customer)
        .mockResolvedValueOnce({ ...customer, ownerId: 'sales-id' });
      mockUserRepository.findOne
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(smUser);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(true);
      mockCustomerRepository.save.mockResolvedValue(customer);

      await service.assign('customer-id', 'sales-id', 'sm-id');
      expect(mockDataPermissionService.canAssignToUser).toHaveBeenCalledWith('sm-id', 'sales-id');
    });

    it('销售无法分配客户', async () => {
      const customer = { id: 'customer-id', ownerId: 'old-owner' } as Customer;
      const targetUser = { id: 'target-id', role: UserRole.SALES } as User;
      const salesUser = { id: 'sales-id', role: UserRole.SALES } as User;

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockUserRepository.findOne
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(salesUser);
      mockDataPermissionService.canAssignToUser.mockResolvedValue(false);

      await expect(service.assign('customer-id', 'target-id', 'sales-id')).rejects.toThrow(ForbiddenException);
    });

    it('客户不存在时抛出NotFoundException', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.assign('non-existent', 'target-id', 'user-id')).rejects.toThrow(NotFoundException);
    });

    it('目标用户不存在时抛出NotFoundException', async () => {
      const customer = { id: 'customer-id' } as Customer;

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.assign('customer-id', 'non-existent', 'user-id')).rejects.toThrow(NotFoundException);
    });
  });
});
