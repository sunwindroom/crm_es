import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Contract } from '../../contract/entities/contract.entity';
import { Opportunity } from '../../opportunity/entities/opportunity.entity';
import { FollowUp } from '../../follow-up/entities/follow-up.entity';
import { CustomerVisit } from '../../customer/entities/customer-visit.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { CustomerValueQueryDto, DistributionQueryDto, ActivityQueryDto } from '../dto/customer-analysis-query.dto';
import { CustomerValue, CustomerDistribution, CustomerActivity } from '../interfaces/customer-analysis-data.interface';

@Injectable()
export class CustomerAnalysisService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(FollowUp) private followUpRepo: Repository<FollowUp>,
    @InjectRepository(CustomerVisit) private visitRepo: Repository<CustomerVisit>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取客户价值分析
   */
  async getCustomerValue(user: User, query: CustomerValueQueryDto): Promise<CustomerValue[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'customer');
    
    // 2. 构建查询条件
    const where: any = { ...permissionFilter };
    if (query.level) where.level = query.level;
    if (query.industry) where.industry = query.industry;

    // 3. 查询客户
    const customers = await this.customerRepo.find({ where });

    // 4. 计算价值评分
    const customersWithScore = await Promise.all(
      customers.map(async (c) => {
        // 查询客户的合同
        const contracts = await this.contractRepo.find({ where: { customerId: c.id } });
        // 查询客户的商机
        const opportunities = await this.opportunityRepo.find({ where: { customerId: c.id } });

        const contractAmount = contracts.reduce((sum, ct) => sum + Number(ct.amount), 0);
        const paidAmount = contracts.reduce((sum, ct) => sum + Number(ct.paidAmount), 0);

        const valueScore = this.calculateValueScore({
          contractAmount,
          paidAmount,
          opportunityCount: opportunities.length,
          contractCount: contracts.length,
        });

        return {
          customerId: c.id,
          customerName: c.name,
          level: c.level,
          industry: c.industry || '',
          contractAmount,
          paidAmount,
          opportunityCount: opportunities.length,
          contractCount: contracts.length,
          valueScore,
          rank: 0, // 稍后计算
        };
      })
    );

    // 5. 排序
    const sorted = customersWithScore.sort((a, b) => {
      if (query.sortBy === 'contractAmount') return b.contractAmount - a.contractAmount;
      if (query.sortBy === 'paidAmount') return b.paidAmount - a.paidAmount;
      return b.valueScore - a.valueScore;
    });

    // 6. 计算排名
    sorted.forEach((c, index) => {
      c.rank = index + 1;
    });

    // 7. 返回限制数量
    return sorted.slice(0, query.limit || 20);
  }

  /**
   * 获取客户分布统计
   */
  async getCustomerDistribution(user: User, query: DistributionQueryDto): Promise<CustomerDistribution[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'customer');
    
    // 2. 按维度分组统计
    const dimension = query.dimension || 'industry';
    const distribution = await this.customerRepo
      .createQueryBuilder('c')
      .select(`c.${dimension}`, 'value')
      .addSelect('COUNT(*)', 'count')
      .where(permissionFilter)
      .groupBy(`c.${dimension}`)
      .getRawMany();

    // 3. 计算占比
    const total = distribution.reduce((sum, d) => sum + Number(d.count), 0);
    return distribution.map(d => ({
      value: d.value || '未知',
      count: Number(d.count),
      percentage: total > 0 ? (Number(d.count) / total) * 100 : 0,
    }));
  }

  /**
   * 获取客户活跃度分析
   */
  async getCustomerActivity(user: User, query: ActivityQueryDto): Promise<CustomerActivity[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'customer');
    
    // 2. 查询客户
    const customers = await this.customerRepo.find({ where: permissionFilter });
    const silentDays = query.silentDays || 30;
    const now = new Date();

    // 3. 查询每个客户的活跃度
    const activities = await Promise.all(
      customers.map(async (c) => {
        // 查询最后跟进时间
        const lastFollowUp = await this.followUpRepo.findOne({
          where: { objectId: c.id },
          order: { createdAt: 'DESC' },
        });

        // 查询最后拜访时间
        const lastVisit = await this.visitRepo.findOne({
          where: { customerId: c.id },
          order: { visitDate: 'DESC' },
        });

        // 查询跟进次数
        const followUpCount = await this.followUpRepo.count({
          where: { objectId: c.id },
        });

        // 查询拜访次数
        const visitCount = await this.visitRepo.count({
          where: { customerId: c.id },
        });

        // 计算距离上次活动的天数
        const lastActivityDate = lastFollowUp?.createdAt || lastVisit?.visitDate;
        const daysSinceLastActivity = lastActivityDate
          ? Math.floor((now.getTime() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // 判断活跃度
        let activityLevel: 'active' | 'inactive' | 'silent';
        if (daysSinceLastActivity <= 7) {
          activityLevel = 'active';
        } else if (daysSinceLastActivity <= silentDays) {
          activityLevel = 'inactive';
        } else {
          activityLevel = 'silent';
        }

        return {
          customerId: c.id,
          customerName: c.name,
          lastFollowUpAt: lastFollowUp?.createdAt || null,
          lastVisitAt: lastVisit?.visitDate || null,
          followUpCount,
          visitCount,
          daysSinceLastActivity,
          activityLevel,
        };
      })
    );

    // 4. 根据活跃度类型筛选
    if (query.activityType) {
      return activities.filter(a => a.activityLevel === query.activityType);
    }

    return activities;
  }

  /**
   * 计算客户价值评分
   */
  private calculateValueScore(data: {
    contractAmount: number;
    paidAmount: number;
    opportunityCount: number;
    contractCount: number;
  }): number {
    // 价值评分 = 合同金额权重×合同金额 + 回款金额权重×回款金额 + ...
    const weights = {
      contractAmount: 0.4,
      paidAmount: 0.3,
      opportunityCount: 0.15,
      contractCount: 0.15,
    };

    // 归一化处理(假设合同金额单位为万元)
    const normalizedContractAmount = data.contractAmount / 10000;
    const normalizedPaidAmount = data.paidAmount / 10000;

    return (
      weights.contractAmount * normalizedContractAmount +
      weights.paidAmount * normalizedPaidAmount +
      weights.opportunityCount * data.opportunityCount +
      weights.contractCount * data.contractCount
    );
  }
}
