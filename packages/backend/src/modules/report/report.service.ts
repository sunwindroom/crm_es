import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Lead, LeadStatus } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity, OpportunityStage, OpportunityStatus } from '../opportunity/entities/opportunity.entity';
import { Project, ProjectStatus } from '../project/entities/project.entity';
import { Contract, ContractStatus } from '../contract/entities/contract.entity';
import { PaymentPlan, PaymentStatus } from '../payment/entities/payment-plan.entity';
import { Milestone, MilestoneStatus } from '../project/entities/milestone.entity';
import { ProjectTimesheet } from '../project/entities/project-timesheet.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentPlan) private paymentRepo: Repository<PaymentPlan>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(ProjectTimesheet) private timesheetRepo: Repository<ProjectTimesheet>,
  ) {}

  /**
   * 获取仪表盘统计数据
   */
  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate ? Between(startDate, endDate) : undefined;

    // 线索统计
    const totalLeads = await this.leadRepo.count();
    const newLeads = dateFilter 
      ? await this.leadRepo.count({ where: { createdAt: dateFilter } })
      : await this.leadRepo.count({ where: { status: LeadStatus.NEW } });
    const convertedLeads = await this.leadRepo.count({ where: { status: LeadStatus.CONVERTED } });
    const lostLeads = await this.leadRepo.count({ where: { status: LeadStatus.LOST } });

    // 客户统计
    const totalCustomers = await this.customerRepo.count();
    const newCustomers = dateFilter
      ? await this.customerRepo.count({ where: { createdAt: dateFilter } })
      : totalCustomers;

    // 商机统计
    const activeOpportunities = await this.opportunityRepo.find({
      where: { status: OpportunityStatus.ACTIVE },
    });
    const totalOpportunityAmount = activeOpportunities.reduce((sum, o) => sum + Number(o.amount), 0);
    const weightedAmount = activeOpportunities.reduce(
      (sum, o) => sum + Number(o.amount) * (o.probability || 0) / 100,
      0
    );
    const wonOpportunities = await this.opportunityRepo.count({
      where: { status: OpportunityStatus.WON },
    });

    // 合同统计
    const contracts = await this.contractRepo.find({
      where: { status: ContractStatus.EXECUTING },
    });
    const totalContractAmount = contracts.reduce((sum, c) => sum + Number(c.amount), 0);
    const signedContracts = await this.contractRepo.count({
      where: { status: ContractStatus.SIGNED },
    });

    // 回款统计
    const completedPayments = await this.paymentRepo.find({
      where: { status: PaymentStatus.COMPLETED },
    });
    const totalPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.actualAmount || p.amount), 0);
    const pendingPayments = await this.paymentRepo.find({
      where: { status: PaymentStatus.PENDING },
    });
    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // 项目统计
    const totalProjects = await this.projectRepo.count();
    const activeProjects = await this.projectRepo.count({
      where: { status: ProjectStatus.IN_PROGRESS },
    });
    const completedProjects = await this.projectRepo.count({
      where: { status: ProjectStatus.COMPLETED },
    });

    return {
      leads: {
        total: totalLeads,
        new: newLeads,
        converted: convertedLeads,
        lost: lostLeads,
        conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
      },
      opportunities: {
        total: activeOpportunities.length,
        totalAmount: totalOpportunityAmount,
        weightedAmount,
        won: wonOpportunities,
        winRate: activeOpportunities.length > 0 
          ? (wonOpportunities / (activeOpportunities.length + wonOpportunities)) * 100 
          : 0,
      },
      contracts: {
        total: contracts.length,
        totalAmount: totalContractAmount,
        signed: signedContracts,
      },
      payments: {
        paidAmount: totalPaidAmount,
        pendingAmount: totalPendingAmount,
        completionRate: (totalPaidAmount + totalPendingAmount) > 0 
          ? (totalPaidAmount / (totalPaidAmount + totalPendingAmount)) * 100 
          : 0,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
    };
  }

  /**
   * 获取销售漏斗数据
   */
  async getSalesFunnel() {
    const stages = [
      { stage: OpportunityStage.INITIAL, name: '初步接触', probability: 20 },
      { stage: OpportunityStage.REQUIREMENT, name: '需求确认', probability: 40 },
      { stage: OpportunityStage.PROPOSAL, name: '方案报价', probability: 60 },
      { stage: OpportunityStage.NEGOTIATION, name: '商务谈判', probability: 80 },
      { stage: OpportunityStage.CONTRACT, name: '签订合同', probability: 90 },
    ];

    const funnelData = await Promise.all(
      stages.map(async (s) => {
        const opportunities = await this.opportunityRepo.find({
          where: { stage: s.stage, status: OpportunityStatus.ACTIVE },
        });
        const count = opportunities.length;
        const amount = opportunities.reduce((sum, o) => sum + Number(o.amount), 0);
        const weightedAmount = amount * s.probability / 100;

        return {
          stage: s.stage,
          name: s.name,
          probability: s.probability,
          count,
          amount,
          weightedAmount,
        };
      })
    );

    return funnelData;
  }

  /**
   * 获取项目状态统计
   */
  async getProjectStatusStats() {
    const statuses = [
      { status: ProjectStatus.PLANNING, name: '规划中' },
      { status: ProjectStatus.IN_PROGRESS, name: '进行中' },
      { status: ProjectStatus.ON_HOLD, name: '暂停' },
      { status: ProjectStatus.COMPLETED, name: '已完成' },
      { status: ProjectStatus.CANCELLED, name: '已取消' },
    ];

    const stats = await Promise.all(
      statuses.map(async (s) => {
        const count = await this.projectRepo.count({ where: { status: s.status } });
        return {
          status: s.status,
          name: s.name,
          count,
        };
      })
    );

    return stats;
  }

  /**
   * 获取线索来源统计
   */
  async getLeadSourceStats() {
    const leads = await this.leadRepo.find();
    const sourceMap = new Map<string, number>();

    leads.forEach((lead) => {
      const source = lead.source || 'other';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const sourceNames: Record<string, string> = {
      website: '官网',
      referral: '推荐',
      advertisement: '广告',
      exhibition: '展会',
      cold_call: '电话营销',
      other: '其他',
    };

    return Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      name: sourceNames[source] || source,
      count,
    }));
  }

  /**
   * 获取回款趋势数据
   */
  async getPaymentTrend(months = 6) {
    const result = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const payments = await this.paymentRepo.find({
        where: {
          status: PaymentStatus.COMPLETED,
          actualDate: Between(startDate, endDate),
        },
      });

      const amount = payments.reduce((sum, p) => sum + Number(p.actualAmount || p.amount), 0);

      result.push({
        month: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
        amount,
        count: payments.length,
      });
    }

    return result;
  }

  /**
   * 获取项目工时统计
   */
  async getProjectTimesheetStats(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;

    const timesheets = await this.timesheetRepo.find({
      where,
      relations: ['user', 'project'],
    });

    // 按项目分组统计
    const projectMap = new Map<string, any>();
    timesheets.forEach((t) => {
      const pid = t.projectId;
      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: (t as any).project?.name || '-',
          totalHours: 0,
          timesheets: [],
        });
      }
      const project = projectMap.get(pid);
      project.totalHours += Number(t.hours);
      project.timesheets.push(t);
    });

    return Array.from(projectMap.values());
  }

  /**
   * 获取业绩排名
   */
  async getPerformanceRanking(type: 'sales' | 'project' = 'sales', limit = 10) {
    if (type === 'sales') {
      // 销售业绩排名（按回款金额）
      const payments = await this.paymentRepo.find({
        where: { status: PaymentStatus.COMPLETED },
        relations: ['contract'],
      });

      const userMap = new Map<string, { userId: string; userName: string; amount: number }>();

      for (const payment of payments) {
        const contract = await this.contractRepo.findOne({ where: { id: payment.contractId } });
        if (contract) {
          const userId = contract.ownerId;
          if (!userMap.has(userId)) {
            userMap.set(userId, { userId, userName: '', amount: 0 });
          }
          const user = userMap.get(userId)!;
          user.amount += Number(payment.actualAmount || payment.amount);
        }
      }

      return Array.from(userMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, limit);
    } else {
      // 项目业绩排名（按完成项目数）
      const projects = await this.projectRepo.find({
        where: { status: ProjectStatus.COMPLETED },
      });

      const userMap = new Map<string, { userId: string; count: number }>();
      projects.forEach((p) => {
        const userId = p.manager;
        if (!userMap.has(userId)) {
          userMap.set(userId, { userId, count: 0 });
        }
        userMap.get(userId)!.count++;
      });

      return Array.from(userMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    }
  }

  /**
   * 获取综合报表数据
   */
  async getComprehensiveReport(startDate?: Date, endDate?: Date) {
    const [
      dashboardStats,
      salesFunnel,
      projectStatusStats,
      leadSourceStats,
      paymentTrend,
      salesRanking,
    ] = await Promise.all([
      this.getDashboardStats(startDate, endDate),
      this.getSalesFunnel(),
      this.getProjectStatusStats(),
      this.getLeadSourceStats(),
      this.getPaymentTrend(),
      this.getPerformanceRanking('sales'),
    ]);

    return {
      dashboard: dashboardStats,
      salesFunnel,
      projectStatus: projectStatusStats,
      leadSource: leadSourceStats,
      paymentTrend,
      salesRanking,
    };
  }
}
