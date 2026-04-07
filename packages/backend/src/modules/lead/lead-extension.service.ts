import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity, OpportunityStage } from '../opportunity/entities/opportunity.entity';
import { User, UserRole } from '../user/entities/user.entity';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Injectable()
export class LeadExtensionService {
  constructor(
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  /**
   * 分配线索给下级用户
   */
  async assign(leadId: string, assignLeadDto: AssignLeadDto, userId: string): Promise<Lead> {
    // 检查线索是否存在
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 检查目标用户是否存在
    const targetUser = await this.userRepository.findOne({
      where: { id: assignLeadDto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查权限
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new ForbiddenException('用户不存在');
    }

    // 管理员、总裁、营销副总裁可以分配给任何人
    const canAssignAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);
    
    // 其他角色只能分配给下级
    if (!canAssignAnyone && targetUser.superiorId !== userId) {
      throw new ForbiddenException('只能分配给下级用户');
    }

    // 更新线索归属人
    lead.ownerId = assignLeadDto.userId;
    lead.assignedTo = assignLeadDto.userId;
    lead.assignedAt = new Date();

    await this.leadRepository.save(lead);

    return this.leadRepository.findOne({
      where: { id: leadId },
    });
  }

  /**
   * 批量分配线索
   */
  async assignBatch(leadIds: string[], assignLeadDto: AssignLeadDto, userId: string): Promise<void> {
    // 检查目标用户是否存在
    const targetUser = await this.userRepository.findOne({
      where: { id: assignLeadDto.userId },
    });
    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查权限
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new ForbiddenException('用户不存在');
    }

    // 管理员、总裁、营销副总裁可以分配给任何人
    const canAssignAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);
    
    // 其他角色只能分配给下级
    if (!canAssignAnyone && targetUser.superiorId !== userId) {
      throw new ForbiddenException('只能分配给下级用户');
    }

    // 批量更新线索
    await this.leadRepository
      .createQueryBuilder()
      .update(Lead)
      .set({
        ownerId: assignLeadDto.userId,
        assignedTo: assignLeadDto.userId,
        assignedAt: new Date(),
      })
      .whereInIds(leadIds)
      .execute();
  }

  /**
   * 转化线索为客户和商机
   */
  async convert(
    leadId: string,
    convertLeadDto: ConvertLeadDto,
    userId: string,
  ): Promise<{ customer: Customer; opportunity: Opportunity }> {
    // 检查线索是否存在
    const lead = await this.leadRepository.findOne({ where: { id: leadId } });
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 检查线索是否已转化
    if (lead.status === 'converted') {
      throw new BadRequestException('线索已转化');
    }

    // 检查权限
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new ForbiddenException('用户不存在');
    }

    // 管理员、总裁、营销副总裁可以转化任何线索
    const canConvertAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);
    
    // 其他角色只有线索归属人可以转化
    if (!canConvertAnyone && lead.ownerId !== userId && lead.createdBy !== userId) {
      throw new ForbiddenException('只有线索归属人或管理员可以转化线索');
    }

    // 使用事务处理
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 创建客户
      const customer = queryRunner.manager.create(Customer, {
        name: convertLeadDto.customerName || lead.company,
        phone: lead.phone,
        email: lead.email,
        industry: lead.industry,
        ownerId: lead.ownerId || userId,
        createdBy: userId,
      });
      await queryRunner.manager.save(customer);

      // 2. 创建商机
      const opportunity = queryRunner.manager.create(Opportunity, {
        customerId: customer.id,
        leadId: lead.id,
        name: convertLeadDto.opportunityName || `${lead.company} - 商机`,
        amount: convertLeadDto.opportunityAmount || lead.budget || 0,
        stage: OpportunityStage.INITIAL,
        probability: 20,
        ownerId: lead.ownerId || userId,
        createdBy: userId,
      });
      await queryRunner.manager.save(opportunity);

      // 3. 更新线索状态
      lead.status = LeadStatus.CONVERTED;
      await queryRunner.manager.save(lead);

      await queryRunner.commitTransaction();

      return { customer, opportunity };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
