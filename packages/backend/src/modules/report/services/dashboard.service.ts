import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Lead, LeadStatus } from '../../lead/entities/lead.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { Opportunity, OpportunityStatus } from '../../opportunity/entities/opportunity.entity';
import { Contract, ContractStatus } from '../../contract/entities/contract.entity';
import { PaymentPlan, PaymentStatus } from '../../payment/entities/payment-plan.entity';
import { Project, ProjectStatus } from '../../project/entities/project.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { DashboardStats } from '../interfaces/dashboard-stats.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentPlan) private paymentRepo: Repository<PaymentPlan>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取仪表盘统计数据
   */
  async getDashboardStats(user: User, query: DashboardQueryDto): Promise<DashboardStats> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'opportunity');
    
    // 2. 构建时间过滤条件
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const dateFilter = startDate && endDate ? Between(startDate, endDate) : undefined;

    // 3. 并行查询各项指标
    const [
      leadStats,
      customerStats,
      opportunityStats,
      contractStats,
      paymentStats,
      projectStats,
    ] = await Promise.all([
      this.getLeadStats(permissionFilter, dateFilter),
      this.getCustomerStats(permissionFilter, dateFilter),
      this.getOpportunityStats(permissionFilter, dateFilter),
      this.getContractStats(permissionFilter, dateFilter),
      this.getPaymentStats(permissionFilter, dateFilter),
      this.getProjectStats(permissionFilter, dateFilter),
    ]);

    return {
      leads: leadStats,
      customers: customerStats,
      opportunities: opportunityStats,
      contracts: contractStats,
      payments: paymentStats,
      projects: projectStats,
    };
  }

  /**
   * 获取线索统计
   */
  private async getLeadStats(permissionFilter: any, dateFilter: any) {
    const where = { ...permissionFilter };
    
    const total = await this.leadRepo.count({ where });
    const newLeads = dateFilter 
      ? await this.leadRepo.count({ where: { ...where, createdAt: dateFilter } })
      : await this.leadRepo.count({ where: { ...where, status: LeadStatus.NEW } });
    const convertedLeads = await this.leadRepo.count({ where: { ...where, status: LeadStatus.CONVERTED } });
    const lostLeads = await this.leadRepo.count({ where: { ...where, status: LeadStatus.LOST } });

    return {
      total,
      new: newLeads,
      converted: convertedLeads,
      lost: lostLeads,
      conversionRate: total > 0 ? (convertedLeads / total) * 100 : 0,
    };
  }

  /**
   * 获取客户统计
   */
  private async getCustomerStats(permissionFilter: any, dateFilter: any) {
    const where = { ...permissionFilter };
    
    const total = await this.customerRepo.count({ where });
    const newCustomers = dateFilter
      ? await this.customerRepo.count({ where: { ...where, createdAt: dateFilter } })
      : total;

    return {
      total,
      new: newCustomers,
    };
  }

  /**
   * 获取商机统计
   */
  private async getOpportunityStats(permissionFilter: any, dateFilter: any) {
    const where = { ...permissionFilter, status: OpportunityStatus.ACTIVE };
    
    const activeOpportunities = await this.opportunityRepo.find({ where });
    const totalOpportunityAmount = activeOpportunities.reduce((sum, o) => sum + Number(o.amount), 0);
    const weightedAmount = activeOpportunities.reduce(
      (sum, o) => sum + Number(o.amount) * (o.probability || 0) / 100,
      0
    );
    const wonOpportunities = await this.opportunityRepo.count({
      where: { ...permissionFilter, status: OpportunityStatus.WON },
    });

    return {
      total: activeOpportunities.length,
      totalAmount: totalOpportunityAmount,
      weightedAmount,
      won: wonOpportunities,
      winRate: activeOpportunities.length > 0 
        ? (wonOpportunities / (activeOpportunities.length + wonOpportunities)) * 100 
        : 0,
    };
  }

  /**
   * 获取合同统计
   */
  private async getContractStats(permissionFilter: any, dateFilter: any) {
    const where = { ...permissionFilter, status: ContractStatus.EXECUTING };
    
    const contracts = await this.contractRepo.find({ where });
    const totalContractAmount = contracts.reduce((sum, c) => sum + Number(c.amount), 0);
    const signedContracts = await this.contractRepo.count({
      where: { ...permissionFilter, status: ContractStatus.SIGNED },
    });

    return {
      total: contracts.length,
      totalAmount: totalContractAmount,
      signed: signedContracts,
    };
  }

  /**
   * 获取回款统计
   */
  private async getPaymentStats(permissionFilter: any, dateFilter: any) {
    // 获取用户可访问的合同
    const contracts = await this.contractRepo.find({ where: permissionFilter });
    const contractIds = contracts.map(c => c.id);

    if (contractIds.length === 0) {
      return {
        paidAmount: 0,
        pendingAmount: 0,
        completionRate: 0,
      };
    }

    const completedPayments = await this.paymentRepo.find({
      where: { contractId: In(contractIds), status: PaymentStatus.COMPLETED },
    });
    const totalPaidAmount = completedPayments.reduce((sum, p) => sum + Number(p.actualAmount || p.amount), 0);
    
    const pendingPayments = await this.paymentRepo.find({
      where: { contractId: In(contractIds), status: PaymentStatus.PENDING },
    });
    const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      paidAmount: totalPaidAmount,
      pendingAmount: totalPendingAmount,
      completionRate: (totalPaidAmount + totalPendingAmount) > 0 
        ? (totalPaidAmount / (totalPaidAmount + totalPendingAmount)) * 100 
        : 0,
    };
  }

  /**
   * 获取项目统计
   */
  private async getProjectStats(permissionFilter: any, dateFilter: any) {
    const where = { ...permissionFilter };
    
    const total = await this.projectRepo.count({ where });
    const active = await this.projectRepo.count({
      where: { ...where, status: ProjectStatus.IN_PROGRESS },
    });
    const completed = await this.projectRepo.count({
      where: { ...where, status: ProjectStatus.COMPLETED },
    });

    return {
      total,
      active,
      completed,
    };
  }
}
