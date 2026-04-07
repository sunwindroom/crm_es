import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Opportunity, OpportunityStatus } from '../../opportunity/entities/opportunity.entity';
import { Contract, ContractStatus } from '../../contract/entities/contract.entity';
import { PaymentPlan, PaymentStatus } from '../../payment/entities/payment-plan.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { PerformanceQueryDto, TeamPerformanceQueryDto, TrendQueryDto } from '../dto/performance-query.dto';
import { PersonalPerformance, TeamPerformance, PerformanceTrend } from '../interfaces/performance-data.interface';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentPlan) private paymentRepo: Repository<PaymentPlan>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取个人业绩统计
   */
  async getPersonalPerformance(user: User, query: PerformanceQueryDto): Promise<PersonalPerformance> {
    const targetUserId = query.userId || user.id;
    
    // 检查权限
    const hasPermission = await this.permissionService.hasPermission(user, targetUserId);
    if (!hasPermission) {
      throw new Error('无权查看该用户业绩');
    }

    // 构建时间过滤条件
    const startDate = query.startDate ? new Date(query.startDate) : this.getDefaultStartDate(query.period);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const dateFilter = Between(startDate, endDate);

    // 并行查询各项业绩数据
    const [
      opportunityAmount,
      wonAmount,
      contractAmount,
      paidAmount,
      targetAmount,
    ] = await Promise.all([
      this.getOpportunityAmount(targetUserId, dateFilter),
      this.getWonAmount(targetUserId, dateFilter),
      this.getContractAmount(targetUserId, dateFilter),
      this.getPaidAmount(targetUserId, dateFilter),
      this.getTargetAmount(targetUserId, query.period),
    ]);

    // 计算业绩达成率
    const achievementRate = targetAmount > 0 ? (contractAmount / targetAmount) * 100 : 0;

    // 查询业绩排名
    const rank = await this.getPerformanceRank(user, targetUserId, contractAmount);

    // 查询用户信息
    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });

    return {
      userId: targetUserId,
      userName: targetUser?.name || '',
      opportunityAmount,
      wonAmount,
      contractAmount,
      paidAmount,
      targetAmount,
      achievementRate,
      rank,
    };
  }

  /**
   * 获取团队业绩统计
   */
  async getTeamPerformance(user: User, query: TeamPerformanceQueryDto): Promise<TeamPerformance> {
    // 1. 获取团队成员列表
    const memberIds = await this.permissionService.getAccessibleUserIds(user);
    const members = await this.userRepo.find({ where: { id: In(memberIds) } });

    // 2. 并行查询各成员业绩
    const memberPerformances = await Promise.all(
      members.map(m => this.getPersonalPerformance(user, { ...query, userId: m.id }))
    );

    // 3. 汇总团队业绩
    const teamTotal = {
      opportunityAmount: memberPerformances.reduce((sum, m) => sum + m.opportunityAmount, 0),
      wonAmount: memberPerformances.reduce((sum, m) => sum + m.wonAmount, 0),
      contractAmount: memberPerformances.reduce((sum, m) => sum + m.contractAmount, 0),
      paidAmount: memberPerformances.reduce((sum, m) => sum + m.paidAmount, 0),
      memberCount: members.length,
    };

    // 4. 按合同金额排序
    const sortedMembers = memberPerformances.sort((a, b) => b.contractAmount - a.contractAmount);

    return {
      teamTotal,
      members: sortedMembers,
    };
  }

  /**
   * 获取业绩趋势分析
   */
  async getPerformanceTrend(user: User, query: TrendQueryDto): Promise<PerformanceTrend[]> {
    const userIds = await this.permissionService.getAccessibleUserIds(user);
    const months = 12; // 查询最近12个月
    const result: PerformanceTrend[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const dateFilter = Between(startDate, endDate);

      // 查询该月合同金额
      const contracts = await this.contractRepo.find({
        where: {
          ownerId: In(userIds),
          createdAt: dateFilter,
          status: ContractStatus.SIGNED,
        },
      });
      const amount = contracts.reduce((sum, c) => sum + Number(c.amount), 0);

      result.push({
        period: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        amount,
        count: contracts.length,
      });
    }

    // 计算环比和同比增长率
    for (let i = 1; i < result.length; i++) {
      const current = result[i];
      const previous = result[i - 1];
      current.growth = previous.amount > 0 
        ? ((current.amount - previous.amount) / previous.amount) * 100 
        : 0;

      // 同比(去年同期)
      if (i >= 12) {
        const lastYear = result[i - 12];
        current.yoyGrowth = lastYear.amount > 0 
          ? ((current.amount - lastYear.amount) / lastYear.amount) * 100 
          : 0;
      }
    }

    return result;
  }

  /**
   * 获取商机金额
   */
  private async getOpportunityAmount(userId: string, dateFilter: any): Promise<number> {
    const opportunities = await this.opportunityRepo.find({
      where: {
        ownerId: userId,
        createdAt: dateFilter,
        status: OpportunityStatus.ACTIVE,
      },
    });
    return opportunities.reduce((sum, o) => sum + Number(o.amount), 0);
  }

  /**
   * 获取赢单金额
   */
  private async getWonAmount(userId: string, dateFilter: any): Promise<number> {
    const opportunities = await this.opportunityRepo.find({
      where: {
        ownerId: userId,
        createdAt: dateFilter,
        status: OpportunityStatus.WON,
      },
    });
    return opportunities.reduce((sum, o) => sum + Number(o.amount), 0);
  }

  /**
   * 获取合同金额
   */
  private async getContractAmount(userId: string, dateFilter: any): Promise<number> {
    const contracts = await this.contractRepo.find({
      where: {
        ownerId: userId,
        createdAt: dateFilter,
        status: In([ContractStatus.SIGNED, ContractStatus.EXECUTING]),
      },
    });
    return contracts.reduce((sum, c) => sum + Number(c.amount), 0);
  }

  /**
   * 获取回款金额
   */
  private async getPaidAmount(userId: string, dateFilter: any): Promise<number> {
    // 获取用户的合同
    const contracts = await this.contractRepo.find({ where: { ownerId: userId } });
    const contractIds = contracts.map(c => c.id);

    if (contractIds.length === 0) return 0;

    const payments = await this.paymentRepo.find({
      where: {
        contractId: In(contractIds),
        actualDate: dateFilter,
        status: PaymentStatus.COMPLETED,
      },
    });
    return payments.reduce((sum, p) => sum + Number(p.actualAmount || p.amount), 0);
  }

  /**
   * 获取业绩目标
   */
  private async getTargetAmount(userId: string, period: string): Promise<number> {
    // TODO: 从业绩目标表查询
    // 暂时返回默认值
    return 1000000; // 100万
  }

  /**
   * 获取业绩排名
   */
  private async getPerformanceRank(user: User, userId: string, contractAmount: number): Promise<number> {
    const userIds = await this.permissionService.getAccessibleUserIds(user);
    
    // 查询所有用户的合同金额
    const userAmounts = await Promise.all(
      userIds.map(async (id) => {
        const contracts = await this.contractRepo.find({
          where: {
            ownerId: id,
            status: In([ContractStatus.SIGNED, ContractStatus.EXECUTING]),
          },
        });
        const amount = contracts.reduce((sum, c) => sum + Number(c.amount), 0);
        return { userId: id, amount };
      })
    );

    // 排序并找到当前用户的排名
    const sorted = userAmounts.sort((a, b) => b.amount - a.amount);
    const rank = sorted.findIndex(u => u.userId === userId) + 1;

    return rank;
  }

  /**
   * 获取默认开始日期
   */
  private getDefaultStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterMonth, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
}
