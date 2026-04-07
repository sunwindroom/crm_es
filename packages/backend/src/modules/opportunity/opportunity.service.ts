import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DataSource } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityStatus } from './entities/opportunity.entity';
import { OpportunityFollowUp } from './entities/opportunity-follow-up.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { User, UserRole } from '../user/entities/user.entity';
import { Project, ProjectStatus } from '../project/entities/project.entity';
import { Customer } from '../customer/entities/customer.entity';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectRepository(Opportunity) private repo: Repository<Opportunity>,
    @InjectRepository(OpportunityFollowUp) private followUpRepo: Repository<OpportunityFollowUp>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private dataPermissionService: DataPermissionService,
    private dataSource: DataSource,
  ) {}

  async create(dto: any, userId: string): Promise<Opportunity> {
    if (dto.leadId === '') dto.leadId = undefined;
    if (dto.customerId === '') dto.customerId = undefined;
    if (dto.ownerId === '') dto.ownerId = undefined;
    const entity = this.repo.create({ ...dto, createdBy: userId, ownerId: dto.ownerId || userId });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, stage, status, customerId, keyword } = q;
    const base: any = {};
    if (stage) base.stage = stage;
    if (status) base.status = status;
    if (customerId) base.customerId = customerId;

    // 添加数据权限过滤
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      // 如果返回null，表示管理员，不过滤
      if (accessibleIds !== null) {
        base.ownerId = In(accessibleIds);
      }
    }

    let where: any = base;
    if (keyword) {
      where = [{ ...base, name: Like(`%${keyword}%`) }];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ['customer', 'owner'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string, userId?: string): Promise<Opportunity> {
    const o = await this.repo.findOne({ where: { id }, relations: ['customer', 'owner', 'creator'] });
    if (!o) throw new NotFoundException('商机不存在');

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(o.ownerId || '')) {
        throw new ForbiddenException('无权访问该商机');
      }
    }

    return o;
  }

  async update(id: string, dto: any, userId: string): Promise<Opportunity> {
    const o = await this.findOne(id);

    // 检查权限：只有系统管理员、总裁或营销副总裁可以编辑
    const canEdit = await this.dataPermissionService.canEditAllData(userId);
    if (!canEdit) {
      throw new ForbiddenException('只有系统管理员、总裁或营销副总裁可以编辑商机');
    }

    Object.assign(o, dto);
    await this.repo.save(o);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const o = await this.findOne(id);

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除商机');
    }

    await this.repo.remove(o);
  }

  async updateStage(id: string, stage: OpportunityStage, userId: string): Promise<Opportunity> {
    const o = await this.findOne(id);

    // 检查数据权限
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    if (accessibleIds !== null && !accessibleIds.includes(o.ownerId || '')) {
      throw new ForbiddenException('无权操作该商机');
    }

    const probMap: any = { initial:20, requirement:40, proposal:60, negotiation:80, contract:90 };
    o.stage = stage;
    o.probability = probMap[stage] || 20;
    await this.repo.save(o);
    return this.findOne(id);
  }

  async markAsWon(id: string): Promise<Opportunity> {
    const o = await this.findOne(id);
    o.status = OpportunityStatus.WON;
    o.probability = 100;
    await this.repo.save(o);
    return this.findOne(id);
  }

  async markAsLost(id: string, reason?: string): Promise<Opportunity> {
    const o = await this.findOne(id);
    o.status = OpportunityStatus.LOST;
    o.probability = 0;
    o.lostReason = reason || '';
    await this.repo.save(o);
    return this.findOne(id);
  }

  async getSalesFunnel() {
    const opps = await this.repo.find({ where: { status: OpportunityStatus.ACTIVE } });
    const stages = ['initial','requirement','proposal','negotiation','contract'];
    return stages.map(stage => ({
      stage,
      count: opps.filter(o => o.stage === stage).length,
      totalAmount: opps.filter(o => o.stage === stage).reduce((s, o) => s + Number(o.amount), 0),
    }));
  }

  async getSalesForecast() {
    const opps = await this.repo.find({ where: { status: OpportunityStatus.ACTIVE } });
    return {
      totalAmount: opps.reduce((s, o) => s + Number(o.amount), 0),
      weightedAmount: opps.reduce((s, o) => s + Number(o.amount) * o.probability / 100, 0),
      count: opps.length,
    };
  }

  /**
   * 分配商机给下级
   */
  async assign(opportunityId: string, toUserId: string, operatorUserId: string): Promise<Opportunity> {
    const opportunity = await this.repo.findOne({ where: { id: opportunityId } });
    if (!opportunity) throw new NotFoundException('商机不存在');

    const targetUser = await this.userRepo.findOne({ where: { id: toUserId } });
    if (!targetUser) throw new NotFoundException('目标用户不存在');

    const currentUser = await this.userRepo.findOne({ where: { id: operatorUserId } });
    if (!currentUser) throw new ForbiddenException('用户不存在');

    // 管理员、总裁、营销副总裁可以分配给任何人
    const canAssignAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);
    
    // 其他角色只能分配给下级
    if (!canAssignAnyone && targetUser.superiorId !== operatorUserId) {
      throw new ForbiddenException('只能分配给下级用户');
    }

    opportunity.ownerId = toUserId;
    await this.repo.save(opportunity);
    return this.findOne(opportunityId);
  }

  /**
   * 批量分配商机
   */
  async batchAssign(opportunityIds: string[], toUserId: string, operatorUserId: string): Promise<void> {
    const targetUser = await this.userRepo.findOne({ where: { id: toUserId } });
    if (!targetUser) throw new NotFoundException('目标用户不存在');

    const currentUser = await this.userRepo.findOne({ where: { id: operatorUserId } });
    if (!currentUser) throw new ForbiddenException('用户不存在');

    // 管理员、总裁、营销副总裁可以分配给任何人
    const canAssignAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);
    
    // 其他角色只能分配给下级
    if (!canAssignAnyone && targetUser.superiorId !== operatorUserId) {
      throw new ForbiddenException('只能分配给下级用户');
    }

    await this.repo
      .createQueryBuilder()
      .update(Opportunity)
      .set({ ownerId: toUserId })
      .whereInIds(opportunityIds)
      .execute();
  }

  /**
   * 添加商机跟进记录
   * 上下级都可以填写商机跟进记录
   */
  async addFollowUp(opportunityId: string, data: any, userId: string): Promise<OpportunityFollowUp> {
    const opportunity = await this.findOne(opportunityId);

    // 检查数据权限：上下级都可以填写跟进记录
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    if (accessibleIds !== null && !accessibleIds.includes(opportunity.ownerId || '')) {
      // 检查是否是上级
      const superiorIds = await this.dataPermissionService.getSuperiorIds(opportunity.ownerId || '');
      if (!superiorIds.includes(userId)) {
        throw new ForbiddenException('无权为该商机添加跟进记录');
      }
    }

    const followUp = this.followUpRepo.create({
      opportunityId,
      content: data.content,
      nextAction: data.nextAction,
      nextActionDate: data.nextActionDate,
      remark: data.remark,
      createdBy: userId,
    });

    return this.followUpRepo.save(followUp);
  }

  /**
   * 获取商机跟进记录
   * 上下级都可以查看商机跟进记录
   */
  async getFollowUps(opportunityId: string, userId?: string): Promise<OpportunityFollowUp[]> {
    const opportunity = await this.findOne(opportunityId);

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(opportunity.ownerId || '')) {
        // 检查是否是上级
        const superiorIds = await this.dataPermissionService.getSuperiorIds(opportunity.ownerId || '');
        if (!superiorIds.includes(userId)) {
          throw new ForbiddenException('无权查看该商机的跟进记录');
        }
      }
    }

    return this.followUpRepo.find({
      where: { opportunityId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 赢单商机转化为项目
   * 只有赢单状态的商机可以转化为项目
   * 自动将客户负责人设为项目的客服经理
   */
  async convertToProject(opportunityId: string, projectData: any, userId: string): Promise<Project> {
    const opportunity = await this.findOne(opportunityId);

    // 检查商机是否为赢单状态
    if (opportunity.status !== OpportunityStatus.WON) {
      throw new BadRequestException('只有赢单状态的商机可以转化为项目');
    }

    // 检查是否已转化为项目
    if (opportunity.projectId) {
      throw new BadRequestException('该商机已转化为项目');
    }

    // 检查权限：商机负责人或管理员可以转化
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && opportunity.ownerId !== userId) {
      throw new ForbiddenException('只有商机负责人或管理员可以将商机转化为项目');
    }

    // 获取客户信息，以便将客户负责人设为客服经理
    const customer = await this.customerRepo.findOne({ where: { id: opportunity.customerId } });
    const csManagerId = customer?.ownerId; // 客户负责人作为客服经理

    // 使用事务创建项目并更新商机
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建项目
      const project = queryRunner.manager.create(Project, {
        name: projectData.name || `${opportunity.name} - 项目`,
        customerId: opportunity.customerId,
        opportunityId: opportunity.id,
        type: projectData.type || 'development',
        status: ProjectStatus.PLANNING,
        manager: projectData.managerId, // 项目经理由技术副总裁后续指定，初始可为空
        csManager: csManagerId, // 客服经理自动设为客户负责人
        startDate: projectData.startDate || new Date(),
        endDate: projectData.endDate,
        budget: projectData.budget || opportunity.amount,
        description: projectData.description || opportunity.description,
        createdBy: userId,
      });

      await queryRunner.manager.save(project);

      // 更新商机的项目ID
      await queryRunner.manager.update(Opportunity, opportunityId, {
        projectId: project.id,
      });

      await queryRunner.commitTransaction();

      return project;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
