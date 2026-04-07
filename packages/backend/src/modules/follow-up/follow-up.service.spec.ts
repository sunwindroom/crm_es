import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { FollowUpService } from './follow-up.service';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { FollowUp } from './entities/follow-up.entity';
import { Lead } from '../lead/entities/lead.entity';
import { User } from '../user/entities/user.entity';

describe('FollowUpService', () => {
  let service: FollowUpService;
  let followUpRepository: Repository<FollowUp>;
  let leadRepository: Repository<Lead>;
  let dataPermissionService: DataPermissionService;

  const mockFollowUpRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
  };

  const mockLeadRepository = {
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockDataPermissionService = {
    canManageCustomer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowUpService,
        {
          provide: getRepositoryToken(FollowUp),
          useValue: mockFollowUpRepository,
        },
        {
          provide: getRepositoryToken(Lead),
          useValue: mockLeadRepository,
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

    service = module.get<FollowUpService>(FollowUpService);
    followUpRepository = module.get<Repository<FollowUp>>(getRepositoryToken(FollowUp));
    leadRepository = module.get<Repository<Lead>>(getRepositoryToken(Lead));
    dataPermissionService = module.get<DataPermissionService>(DataPermissionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('总裁可以添加跟进记录', async () => {
      const lead = { id: 'lead-id', ownerId: 'owner-id' } as Lead;
      const createDto = { leadId: 'lead-id', content: '跟进内容' };
      const followUp = { id: 'followup-id', ...createDto };

      mockLeadRepository.findOne.mockResolvedValue(lead);
      mockDataPermissionService.canManageCustomer.mockResolvedValue(true);
      mockFollowUpRepository.create.mockReturnValue(followUp);
      mockFollowUpRepository.save.mockResolvedValue(followUp);

      const result = await service.create(createDto, 'ceo-id');
      expect(result).toEqual(followUp);
      expect(mockDataPermissionService.canManageCustomer).toHaveBeenCalledWith('ceo-id', 'owner-id');
    });

    it('CMO可以添加跟进记录', async () => {
      const lead = { id: 'lead-id', ownerId: 'owner-id' } as Lead;
      const createDto = { leadId: 'lead-id', content: '跟进内容' };
      const followUp = { id: 'followup-id', ...createDto };

      mockLeadRepository.findOne.mockResolvedValue(lead);
      mockDataPermissionService.canManageCustomer.mockResolvedValue(true);
      mockFollowUpRepository.create.mockReturnValue(followUp);
      mockFollowUpRepository.save.mockResolvedValue(followUp);

      const result = await service.create(createDto, 'cmo-id');
      expect(result).toEqual(followUp);
    });

    it('销售经理可以为下属客户添加跟进', async () => {
      const lead = { id: 'lead-id', ownerId: 'sales-id' } as Lead;
      const createDto = { leadId: 'lead-id', content: '跟进内容' };
      const followUp = { id: 'followup-id', ...createDto };

      mockLeadRepository.findOne.mockResolvedValue(lead);
      mockDataPermissionService.canManageCustomer.mockResolvedValue(true);
      mockFollowUpRepository.create.mockReturnValue(followUp);
      mockFollowUpRepository.save.mockResolvedValue(followUp);

      const result = await service.create(createDto, 'sm-id');
      expect(result).toEqual(followUp);
    });

    it('销售只能为自己的客户添加跟进', async () => {
      const lead = { id: 'lead-id', ownerId: 'sales-id' } as Lead;
      const createDto = { leadId: 'lead-id', content: '跟进内容' };
      const followUp = { id: 'followup-id', ...createDto };

      mockLeadRepository.findOne.mockResolvedValue(lead);
      mockDataPermissionService.canManageCustomer.mockResolvedValue(true);
      mockFollowUpRepository.create.mockReturnValue(followUp);
      mockFollowUpRepository.save.mockResolvedValue(followUp);

      const result = await service.create(createDto, 'sales-id');
      expect(result).toEqual(followUp);
    });

    it('无权限时抛出ForbiddenException', async () => {
      const lead = { id: 'lead-id', ownerId: 'owner-id' } as Lead;
      const createDto = { leadId: 'lead-id', content: '跟进内容' };

      mockLeadRepository.findOne.mockResolvedValue(lead);
      mockDataPermissionService.canManageCustomer.mockResolvedValue(false);

      await expect(service.create(createDto, 'sales-id')).rejects.toThrow(ForbiddenException);
    });

    it('线索不存在时抛出NotFoundException', async () => {
      const createDto = { leadId: 'non-existent', content: '跟进内容' };

      mockLeadRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 'user-id')).rejects.toThrow(NotFoundException);
    });
  });
});
