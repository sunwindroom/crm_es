import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Contract } from '../../contract/entities/contract.entity';
import { PaymentPlan, PaymentStatus } from '../../payment/entities/payment-plan.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { PaymentProgressQueryDto, ForecastQueryDto, OverdueQueryDto } from '../dto/payment-stats-query.dto';
import { PaymentProgress, PaymentForecast, OverduePayment } from '../interfaces/payment-stats-data.interface';

@Injectable()
export class PaymentStatsService {
  constructor(
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentPlan) private paymentRepo: Repository<PaymentPlan>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取回款进度统计
   */
  async getPaymentProgress(user: User, query: PaymentProgressQueryDto): Promise<PaymentProgress[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'contract');
    
    // 2. 构建查询条件
    const where: any = { ...permissionFilter };
    if (query.contractStatus) where.status = query.contractStatus;

    // 3. 查询合同
    const contracts = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .leftJoinAndSelect('c.owner', 'owner')
      .where(where)
      .getMany();

    // 4. 计算回款进度
    const progress = contracts.map(c => {
      const paymentRate = c.amount > 0 ? (Number(c.paidAmount) / Number(c.amount)) * 100 : 0;
      const pendingAmount = Number(c.amount) - Number(c.paidAmount);

      return {
        contractId: c.id,
        contractNo: c.contractNo,
        contractName: c.name,
        amount: Number(c.amount),
        paidAmount: Number(c.paidAmount),
        paymentRate,
        pendingAmount,
        ownerName: (c as any).owner?.name || '',
        customerName: (c as any).customer?.name || '',
      };
    });

    // 5. 根据回款率筛选
    let filtered = progress;
    if (query.minPaymentRate !== undefined) {
      filtered = filtered.filter(p => p.paymentRate >= query.minPaymentRate);
    }
    if (query.maxPaymentRate !== undefined) {
      filtered = filtered.filter(p => p.paymentRate <= query.maxPaymentRate);
    }

    return filtered;
  }

  /**
   * 获取回款预测
   */
  async getPaymentForecast(user: User, query: ForecastQueryDto): Promise<PaymentForecast[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'contract');
    
    // 2. 获取用户可访问的合同
    const contracts = await this.contractRepo.find({ where: permissionFilter });
    const contractIds = contracts.map(c => c.id);

    if (contractIds.length === 0) return [];

    // 3. 查询未完成的回款计划
    const pendingPlans = await this.paymentRepo.find({
      where: {
        contractId: In(contractIds),
        status: PaymentStatus.PENDING,
      },
    });

    // 4. 按月份分组统计
    const months = query.months || 6;
    const now = new Date();
    const forecast: PaymentForecast[] = [];

    for (let i = 0; i < months; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);

      const monthPlans = pendingPlans.filter(p => {
        const plannedDate = new Date(p.plannedDate);
        return plannedDate >= month && plannedDate <= monthEnd;
      });

      const plannedAmount = monthPlans.reduce((sum, p) => sum + Number(p.amount), 0);

      forecast.push({
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        plannedAmount,
        plannedCount: monthPlans.length,
      });
    }

    return forecast;
  }

  /**
   * 获取逾期回款统计
   */
  async getOverduePayments(user: User, query: OverdueQueryDto): Promise<OverduePayment[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'contract');
    
    // 2. 获取用户可访问的合同
    const contracts = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.customer', 'customer')
      .leftJoinAndSelect('c.owner', 'owner')
      .where(permissionFilter)
      .getMany();
    const contractIds = contracts.map(c => c.id);

    if (contractIds.length === 0) return [];

    // 3. 查询逾期计划
    const now = new Date();
    const overduePlans = await this.paymentRepo
      .createQueryBuilder('pp')
      .where('pp.contractId IN (:...contractIds)', { contractIds })
      .andWhere('pp.status = :status', { status: PaymentStatus.PENDING })
      .andWhere('pp.plannedDate < :now', { now })
      .getMany();

    // 4. 计算逾期天数并构建结果
    const overduePayments = overduePlans.map(p => {
      const plannedDate = new Date(p.plannedDate);
      const overdueDays = Math.floor((now.getTime() - plannedDate.getTime()) / (1000 * 60 * 60 * 24));
      const contract = contracts.find(c => c.id === p.contractId);

      return {
        planId: p.id,
        contractId: p.contractId,
        contractNo: contract?.contractNo || '',
        contractName: contract?.name || '',
        plannedAmount: Number(p.amount),
        plannedDate: p.plannedDate,
        overdueDays,
        ownerName: (contract as any)?.owner?.name || '',
        customerName: (contract as any)?.customer?.name || '',
      };
    });

    // 5. 根据逾期天数筛选
    let filtered = overduePayments;
    if (query.minOverdueDays !== undefined) {
      filtered = filtered.filter(p => p.overdueDays >= query.minOverdueDays);
    }
    if (query.maxOverdueDays !== undefined) {
      filtered = filtered.filter(p => p.overdueDays <= query.maxOverdueDays);
    }

    // 6. 按逾期天数降序排序
    return filtered.sort((a, b) => b.overdueDays - a.overdueDays);
  }
}
