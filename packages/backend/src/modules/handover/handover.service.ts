import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Handover, HandoverStatus, HandoverType } from './entities/handover.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { Lead } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { Project } from '../project/entities/project.entity';
import { Contract } from '../contract/entities/contract.entity';
import { PaymentPlan } from '../payment/entities/payment-plan.entity';

@Injectable()
export class HandoverService {
  constructor(
    @InjectRepository(Handover)
    private handoverRepository: Repository<Handover>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(PaymentPlan)
    private paymentPlanRepository: Repository<PaymentPlan>,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建离职移交申请
   */
  async createHandover(
    type: HandoverType,
    resourceId: string,
    fromUserId: string,
    toUserId: string,
    reason: string,
    operatorUserId: string,
    remark?: string,
  ): Promise<Handover> {
    // 检查操作权限：只有总裁、营销副总裁、技术副总裁或系统管理员可以创建移交申请
    const operator = await this.userRepository.findOne({ where: { id: operatorUserId } });
    if (!operator) {
      throw new NotFoundException('操作用户不存在');
    }

    if (
      ![
        UserRole.ADMIN,
        UserRole.CEO,
        UserRole.CMO,
        UserRole.CTO,
      ].includes(operator.role)
    ) {
      throw new ForbiddenException('只有总裁、营销副总裁、技术副总裁或系统管理员可以创建离职移交申请');
    }

    // 检查资源是否存在
    await this.validateResourceExistence(type, resourceId);

    // 检查目标用户是否存在
    const toUser = await this.userRepository.findOne({ where: { id: toUserId } });
    if (!toUser) {
      throw new NotFoundException('接收用户不存在');
    }

    // 检查是否已有待处理的移交申请
    const existingHandover = await this.handoverRepository.findOne({
      where: {
        type,
        resourceId,
        status: HandoverStatus.PENDING,
      },
    });

    if (existingHandover) {
      throw new BadRequestException('该资源已有待处理的移交申请');
    }

    // 创建移交申请
    const handover = this.handoverRepository.create({
      type,
      resourceId,
      fromUserId,
      toUserId,
      reason,
      remark,
      status: HandoverStatus.APPROVED, // 直接审批通过
      approvedBy: operatorUserId,
      approvedAt: new Date(),
    });

    await this.handoverRepository.save(handover);

    // 执行移交操作
    await this.executeHandover(handover);

    return handover;
  }

  /**
   * 审批离职移交申请
   */
  async approveHandover(
    handoverId: string,
    approved: boolean,
    operatorUserId: string,
    remark?: string,
  ): Promise<Handover> {
    const handover = await this.handoverRepository.findOne({
      where: { id: handoverId },
      relations: ['fromUser', 'toUser'],
    });

    if (!handover) {
      throw new NotFoundException('移交申请不存在');
    }

    if (handover.status !== HandoverStatus.PENDING) {
      throw new BadRequestException('该移交申请已被处理');
    }

    // 检查审批权限
    const operator = await this.userRepository.findOne({ where: { id: operatorUserId } });
    if (!operator) {
      throw new NotFoundException('操作用户不存在');
    }

    if (
      ![
        UserRole.ADMIN,
        UserRole.CEO,
        UserRole.CMO,
        UserRole.CTO,
      ].includes(operator.role)
    ) {
      throw new ForbiddenException('只有总裁、营销副总裁、技术副总裁或系统管理员可以审批离职移交');
    }

    handover.status = approved ? HandoverStatus.APPROVED : HandoverStatus.REJECTED;
    handover.approvedBy = operatorUserId;
    handover.approvedAt = new Date();
    handover.remark = remark || handover.remark;

    await this.handoverRepository.save(handover);

    // 如果审批通过，执行移交操作
    if (approved) {
      await this.executeHandover(handover);
    }

    return handover;
  }

  /**
   * 执行移交操作
   */
  private async executeHandover(handover: Handover): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      switch (handover.type) {
        case HandoverType.LEAD:
          await this.handoverLead(handover.resourceId, handover.toUserId, queryRunner);
          break;
        case HandoverType.CUSTOMER:
          await this.handoverCustomer(handover.resourceId, handover.toUserId, queryRunner);
          break;
        case HandoverType.OPPORTUNITY:
          await this.handoverOpportunity(handover.resourceId, handover.toUserId, queryRunner);
          break;
        case HandoverType.PROJECT:
          await this.handoverProject(handover.resourceId, handover.toUserId, queryRunner);
          break;
        case HandoverType.CONTRACT:
          await this.handoverContract(handover.resourceId, handover.toUserId, queryRunner);
          break;
        case HandoverType.PAYMENT:
          await this.handoverPayment(handover.resourceId, handover.toUserId, queryRunner);
          break;
      }

      // 更新移交状态为已完成
      await queryRunner.manager.update(Handover, handover.id, {
        status: HandoverStatus.COMPLETED,
        completedAt: new Date(),
      });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 移交线索
   */
  private async handoverLead(leadId: string, toUserId: string, queryRunner: any): Promise<void> {
    const lead = await queryRunner.manager.findOne(Lead, { where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    await queryRunner.manager.update(Lead, leadId, {
      ownerId: toUserId,
      assignedTo: toUserId,
      assignedAt: new Date(),
    });
  }

  /**
   * 移交客户
   */
  private async handoverCustomer(customerId: string, toUserId: string, queryRunner: any): Promise<void> {
    const customer = await queryRunner.manager.findOne(Customer, { where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    await queryRunner.manager.update(Customer, customerId, {
      ownerId: toUserId,
    });
  }

  /**
   * 移交商机
   */
  private async handoverOpportunity(opportunityId: string, toUserId: string, queryRunner: any): Promise<void> {
    const opportunity = await queryRunner.manager.findOne(Opportunity, { where: { id: opportunityId } });
    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    await queryRunner.manager.update(Opportunity, opportunityId, {
      ownerId: toUserId,
    });
  }

  /**
   * 移交项目
   */
  private async handoverProject(projectId: string, toUserId: string, queryRunner: any): Promise<void> {
    const project = await queryRunner.manager.findOne(Project, { where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    await queryRunner.manager.update(Project, projectId, {
      manager: toUserId,
    });
  }

  /**
   * 移交合同
   */
  private async handoverContract(contractId: string, toUserId: string, queryRunner: any): Promise<void> {
    const contract = await queryRunner.manager.findOne(Contract, { where: { id: contractId } });
    if (!contract) {
      throw new NotFoundException('合同不存在');
    }

    await queryRunner.manager.update(Contract, contractId, {
      ownerId: toUserId,
    });
  }

  /**
   * 移交回款
   */
  private async handoverPayment(paymentId: string, toUserId: string, queryRunner: any): Promise<void> {
    const payment = await queryRunner.manager.findOne(PaymentPlan, { where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('回款计划不存在');
    }

    // 回款计划不需要移交，因为它关联的是合同，合同已经移交了
    // 这里只是为了保持一致性，如果有其他需要更新的字段可以在这里处理
  }

  /**
   * 验证资源是否存在
   */
  private async validateResourceExistence(type: HandoverType, resourceId: string): Promise<void> {
    switch (type) {
      case HandoverType.LEAD:
        const lead = await this.leadRepository.findOne({ where: { id: resourceId } });
        if (!lead) throw new NotFoundException('线索不存在');
        break;
      case HandoverType.CUSTOMER:
        const customer = await this.customerRepository.findOne({ where: { id: resourceId } });
        if (!customer) throw new NotFoundException('客户不存在');
        break;
      case HandoverType.OPPORTUNITY:
        const opportunity = await this.opportunityRepository.findOne({ where: { id: resourceId } });
        if (!opportunity) throw new NotFoundException('商机不存在');
        break;
      case HandoverType.PROJECT:
        const project = await this.projectRepository.findOne({ where: { id: resourceId } });
        if (!project) throw new NotFoundException('项目不存在');
        break;
      case HandoverType.CONTRACT:
        const contract = await this.contractRepository.findOne({ where: { id: resourceId } });
        if (!contract) throw new NotFoundException('合同不存在');
        break;
      case HandoverType.PAYMENT:
        const payment = await this.paymentPlanRepository.findOne({ where: { id: resourceId } });
        if (!payment) throw new NotFoundException('回款计划不存在');
        break;
    }
  }

  /**
   * 获取移交历史记录
   */
  async getHandoverHistory(resourceId: string, type?: HandoverType): Promise<Handover[]> {
    const where: any = { resourceId };
    if (type) {
      where.type = type;
    }

    return this.handoverRepository.find({
      where,
      relations: ['fromUser', 'toUser', 'approvedUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取待处理的移交申请
   */
  async getPendingHandovers(): Promise<Handover[]> {
    return this.handoverRepository.find({
      where: { status: HandoverStatus.PENDING },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }
}
