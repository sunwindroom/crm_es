import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityStatus } from './entities/opportunity.entity';
import { Project, ProjectType, ProjectStatus } from '../project/entities/project.entity';
import { Contract, ContractStatus } from '../contract/entities/contract.entity';
import { PaymentPlan } from '../payment/entities/payment-plan.entity';
import { Customer } from '../customer/entities/customer.entity';
import { WinOpportunityDto } from './dto/win-opportunity.dto';
import { LoseOpportunityDto } from './dto/lose-opportunity.dto';

@Injectable()
export class OpportunityExtensionService {
  constructor(
    @InjectRepository(Opportunity)
    private opportunityRepository: Repository<Opportunity>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(PaymentPlan)
    private paymentPlanRepository: Repository<PaymentPlan>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private dataSource: DataSource,
  ) {}

  /**
   * 赢单处理：创建项目、合同和回款计划
   * 客服经理自动设为客户负责人
   * 项目经理留空，由技术副总裁后续指定
   */
  async win(
    opportunityId: string,
    winOpportunityDto: WinOpportunityDto,
    userId: string,
  ): Promise<{ project: Project; contract: Contract; paymentPlans: PaymentPlan[] }> {
    // 检查商机是否存在
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: ['customer'],
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 检查商机状态
    if (opportunity.status !== OpportunityStatus.ACTIVE) {
      throw new BadRequestException('商机已处理');
    }

    // 检查权限：只有商机归属人可以赢单
    if (opportunity.ownerId !== userId && opportunity.createdBy !== userId) {
      throw new ForbiddenException('只有商机归属人可以赢单');
    }

    // 获取客户信息，将客户负责人设为客服经理
    const customer = await this.customerRepository.findOne({
      where: { id: opportunity.customerId },
    });
    const csManagerId = customer?.ownerId; // 客户负责人作为客服经理

    // 使用事务处理
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 创建项目
      const project = queryRunner.manager.create(Project, {
        customerId: opportunity.customerId,
        opportunityId: opportunity.id,
        name: winOpportunityDto.projectName || `${opportunity.name} - 项目`,
        type: winOpportunityDto.projectType || ProjectType.IMPLEMENTATION,
        status: ProjectStatus.PLANNING,
        priority: 'normal',
        startDate: winOpportunityDto.startDate,
        endDate: winOpportunityDto.endDate,
        manager: null, // 项目经理留空，由技术副总裁后续指定
        csManager: csManagerId, // 客服经理设为客户负责人
        createdBy: userId,
      });
      await queryRunner.manager.save(project);

      // 2. 创建合同
      const contractAmount = winOpportunityDto.contractAmount || opportunity.amount;
      const contract = queryRunner.manager.create(Contract, {
        customerId: opportunity.customerId,
        opportunityId: opportunity.id,
        projectId: project.id,
        contractNo: await this.generateContractNo(),
        name: winOpportunityDto.contractName || `${opportunity.name} - 合同`,
        amount: contractAmount,
        status: ContractStatus.DRAFT,
        startDate: winOpportunityDto.startDate,
        endDate: winOpportunityDto.endDate,
        ownerId: opportunity.ownerId,
        createdBy: userId,
      });
      await queryRunner.manager.save(contract);

      // 3. 创建回款计划
      const paymentPlans: PaymentPlan[] = [];
      const planCount = winOpportunityDto.paymentPlanCount || 3; // 默认3期
      const planAmount = contractAmount / planCount;

      for (let i = 0; i < planCount; i++) {
        const plannedDate = new Date(winOpportunityDto.startDate);
        plannedDate.setMonth(plannedDate.getMonth() + i);

        const paymentPlan = queryRunner.manager.create(PaymentPlan, {
          contractId: contract.id,
          planNo: `${contract.contractNo}-${String(i + 1).padStart(2, '0')}`,
          amount: planAmount,
          plannedDate,
          paymentMethod: 'bank_transfer',
          status: 'pending' as any,
          description: `第${i + 1}期回款`,
        });
        await queryRunner.manager.save(paymentPlan);
        paymentPlans.push(paymentPlan);
      }

      // 4. 更新项目关联合同
      project.contractId = contract.id;
      await queryRunner.manager.save(project);

      // 5. 更新商机状态
      opportunity.status = OpportunityStatus.WON;
      await queryRunner.manager.save(opportunity);

      await queryRunner.commitTransaction();

      return { project, contract, paymentPlans };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 输单处理
   */
  async lose(
    opportunityId: string,
    loseOpportunityDto: LoseOpportunityDto,
    userId: string,
  ): Promise<Opportunity> {
    // 检查商机是否存在
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 检查商机状态
    if (opportunity.status !== OpportunityStatus.ACTIVE) {
      throw new BadRequestException('商机已处理');
    }

    // 检查权限：只有商机归属人可以输单
    if (opportunity.ownerId !== userId && opportunity.createdBy !== userId) {
      throw new ForbiddenException('只有商机归属人可以输单');
    }

    // 更新商机状态
    opportunity.status = OpportunityStatus.LOST;
    opportunity.lostReason = loseOpportunityDto.lostReason;

    await this.opportunityRepository.save(opportunity);

    return this.opportunityRepository.findOne({
      where: { id: opportunityId },
    });
  }

  /**
   * 生成合同编号
   */
  private async generateContractNo(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const prefix = `HT${year}${month}${day}`;

    // 查询当天最大编号
    const contracts = await this.contractRepository
      .createQueryBuilder('contract')
      .where('contract.contract_no LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('contract.contract_no', 'DESC')
      .getOne();

    if (!contracts) {
      return `${prefix}001`;
    }

    const lastNo = parseInt(contracts.contractNo.slice(-3));
    const newNo = String(lastNo + 1).padStart(3, '0');
    return `${prefix}${newNo}`;
  }

  /**
   * 转化商机为项目（阶段为赢单的商机）
   */
  async convertToProject(
    opportunityId: string,
    data: any,
    userId: string,
  ): Promise<Project> {
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: opportunityId },
      relations: ['customer'],
    });

    if (!opportunity) {
      throw new NotFoundException('商机不存在');
    }

    // 检查商机状态是否为赢单
    if (opportunity.status !== OpportunityStatus.WON) {
      throw new BadRequestException('只有赢单的商机才能转化为项目');
    }

    // 检查权限：只有商机归属人可以转化
    if (opportunity.ownerId !== userId && opportunity.createdBy !== userId) {
      throw new ForbiddenException('只有商机归属人可以转化商机');
    }

    // 创建项目
    const project = this.projectRepository.create({
      customerId: opportunity.customerId,
      opportunityId: opportunity.id,
      name: data.name || `${opportunity.name} - 项目`,
      type: data.type || ProjectType.DEVELOPMENT,
      status: ProjectStatus.PLANNING,
      priority: 'normal',
      manager: data.managerId || opportunity.ownerId,
      budget: data.budget || opportunity.amount,
      startDate: data.startDate || new Date(),
      endDate: data.endDate,
      description: data.description,
      createdBy: userId,
    });

    return this.projectRepository.save(project);
  }
}
