import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { Handover, HandoverStatus, HandoverType } from '../handover/entities/handover.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

@Injectable()
export class LeadHandoverService {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Handover) private handoverRepo: Repository<Handover>,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService,
    private dataSource: DataSource,
  ) {}

  /**
   * 验证线索是否满足交接条件
   */
  async validateLeadForHandover(leadId: string): Promise<{ lead: Lead; opportunity: Opportunity; project: Project }> {
    // 1. 检查线索是否存在
    const lead = await this.leadRepo.findOne({
      where: { id: leadId },
      relations: ['assignedUser', 'creator'],
    });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 2. 检查线索状态是否为 converted
    if (lead.status !== LeadStatus.CONVERTED) {
      throw new BadRequestException('线索未转化，无法执行交接');
    }

    // 3. 查找关联商机
    const opportunity = await this.opportunityRepo.findOne({
      where: { leadId },
      relations: ['project'],
    });
    if (!opportunity) {
      throw new BadRequestException('未找到关联商机');
    }

    // 4. 检查商机状态是否为 won
    if (opportunity.status !== 'won') {
      throw new BadRequestException('商机未赢单，无法执行交接');
    }

    // 5. 查找关联项目
    if (!opportunity.projectId) {
      throw new BadRequestException('商机未关联项目');
    }
    const project = await this.projectRepo.findOne({
      where: { id: opportunity.projectId },
    });
    if (!project) {
      throw new NotFoundException('关联项目不存在');
    }

    return { lead, opportunity, project };
  }

  /**
   * 获取或分配客服经理
   */
  async getOrAssignCsManager(csManagerId?: string): Promise<User> {
    // 优先使用传入的客服经理ID
    if (csManagerId) {
      const csManager = await this.userRepo.findOne({ where: { id: csManagerId } });
      if (!csManager) {
        throw new NotFoundException('指定的客服经理不存在');
      }
      if (csManager.role !== UserRole.CUSTOMER_SERVICE_MANAGER) {
        throw new BadRequestException('指定用户不是客服经理');
      }
      if (csManager.status !== 'active') {
        throw new BadRequestException('指定客服经理未激活');
      }
      return csManager;
    }

    // 查询默认客服经理（可以基于配置或负载均衡策略）
    const csManagers = await this.userRepo.find({
      where: { role: UserRole.CUSTOMER_SERVICE_MANAGER, status: UserStatus.ACTIVE },
    });

    if (!csManagers || csManagers.length === 0) {
      throw new BadRequestException('未找到可用的客服经理，请手动指定');
    }

    // 简单策略：返回第一个可用的客服经理
    // TODO: 可以实现更复杂的负载均衡策略
    return csManagers[0];
  }

  /**
   * 执行交接流程（事务）
   */
  async executeHandover(
    leadId: string,
    csManagerId: string,
    currentUserId: string,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const { lead, project } = await this.validateLeadForHandover(leadId);

    // 1. 更新线索负责人
    await queryRunner.manager.update(Lead, { id: leadId }, { assignedTo: csManagerId, assignedAt: new Date() });

    // 2. 更新项目客服经理
    await queryRunner.manager.update(Project, { id: project.id }, { csManager: csManagerId });

    // 3. 创建交接记录
    const handover = queryRunner.manager.create(Handover, {
      type: HandoverType.LEAD,
      resourceId: leadId,
      fromUserId: lead.assignedTo || lead.createdBy,
      toUserId: csManagerId,
      status: HandoverStatus.COMPLETED,
      completedAt: new Date(),
    });
    await queryRunner.manager.save(handover);
  }

  /**
   * 发送交接通知
   */
  async sendHandoverNotifications(
    leadId: string,
    leadName: string,
    fromUserId: string,
    csManagerId: string,
    projectId: string,
    projectName: string,
  ): Promise<void> {
    const notifications = [
      // 通知原销售
      {
        userId: fromUserId,
        type: NotificationType.LEAD_HANDOVER,
        title: '线索交接通知',
        content: `您负责的线索"${leadName}"已赢单并完成交接，已转交给客服经理处理。`,
        resourceType: 'lead',
        resourceId: leadId,
      },
      // 通知客服经理
      {
        userId: csManagerId,
        type: NotificationType.CS_MANAGER_ASSIGNED,
        title: '客服经理分配通知',
        content: `您已被分配为项目"${projectName}"的客服经理，请及时跟进。`,
        resourceType: 'project',
        resourceId: projectId,
      },
    ];

    // 查找CTO用户
    const ctoUsers = await this.userRepo.find({ where: { role: UserRole.CTO, status: UserStatus.ACTIVE } });
    if (ctoUsers && ctoUsers.length > 0) {
      // 通知CTO
      notifications.push({
        userId: ctoUsers[0].id,
        type: NotificationType.PROJECT_ASSIGNED,
        title: '项目交接完成通知',
        content: `线索"${leadName}"赢单交接已完成，请分配项目经理。`,
        resourceType: 'project',
        resourceId: projectId,
      });
    }

    await this.notificationService.sendBatch(notifications);
  }

  /**
   * 触发交接流程
   */
  async triggerHandover(leadId: string, currentUserId: string, csManagerId?: string): Promise<{ success: boolean; message: string }> {
    // 1. 验证交接条件
    const { lead, project } = await this.validateLeadForHandover(leadId);

    // 2. 检查是否已交接
    const existingHandover = await this.handoverRepo.findOne({
      where: {
        type: HandoverType.LEAD,
        resourceId: leadId,
        status: HandoverStatus.COMPLETED,
      },
    });
    if (existingHandover) {
      throw new BadRequestException('线索已完成交接');
    }

    // 3. 获取或分配客服经理
    const csManager = await this.getOrAssignCsManager(csManagerId);

    // 4. 开启事务执行交接
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.executeHandover(leadId, csManager.id, currentUserId, queryRunner);
      await queryRunner.commitTransaction();

      // 5. 异步发送通知
      await this.sendHandoverNotifications(
        leadId,
        lead.name,
        lead.assignedTo || lead.createdBy,
        csManager.id,
        project.id,
        project.name,
      );

      // 6. 记录审计日志
      await this.auditLogService.log({
        action: AuditAction.UPDATE,
        resource: AuditResource.LEAD,
        resourceId: leadId,
        userId: currentUserId,
        remark: `线索交接完成：从销售转交给客服经理${csManager.name}`,
        ip: '0.0.0.0',
        userAgent: 'system',
      });

      return {
        success: true,
        message: `交接成功，客服经理：${csManager.name}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取交接历史
   */
  async getHandoverHistory(leadId: string): Promise<Handover[]> {
    return this.handoverRepo.find({
      where: { type: HandoverType.LEAD, resourceId: leadId },
      relations: ['fromUser', 'toUser', 'approvedUser'],
      order: { createdAt: 'DESC' },
    });
  }
}
