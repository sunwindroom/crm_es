import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { PaymentPlan, PaymentStatus } from "./entities/payment-plan.entity";
import { Contract } from "../contract/entities/contract.entity";
import { PaymentNode } from "../contract/entities/payment-node.entity";
import { DataPermissionService } from "../../common/services/data-permission.service";
import { User, UserRole } from "../user/entities/user.entity";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentPlan) private repo: Repository<PaymentPlan>,
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(PaymentNode) private paymentNodeRepo: Repository<PaymentNode>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataPermissionService: DataPermissionService,
  ) {}

  /**
   * 创建回款计划
   * 在合同管理中添加了回款时间节点，会自动出现在回款管理中
   */
  async create(dto: any, userId?: string): Promise<PaymentPlan> {
    const entity = this.repo.create(dto);
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  /**
   * 从合同回款节点创建回款计划
   */
  async createFromPaymentNode(nodeId: string, userId: string): Promise<PaymentPlan> {
    const node = await this.paymentNodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('回款节点不存在');

    // 检查是否已创建回款计划
    const existing = await this.repo.findOne({ where: { paymentNodeId: nodeId } });
    if (existing) {
      throw new BadRequestException('该回款节点已创建回款计划');
    }

    const plan = this.repo.create({
      contractId: node.contractId,
      paymentNodeId: nodeId,
      amount: node.amount,
      plannedDate: node.plannedDate,
      description: node.description,
      status: PaymentStatus.PENDING,
      createdBy: userId,
    });

    return this.repo.save(plan);
  }

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, status, contractId } = q;
    const where: any = {};
    if (status) where.status = status;
    if (contractId) where.contractId = contractId;

    // 添加数据权限过滤
    if (userId) {
      const canViewAll = await this.dataPermissionService.canViewAllData(userId);
      if (!canViewAll) {
        // 获取用户参与的合同ID列表
        const contracts = await this.contractRepo.find({
          where: [
            { ownerId: userId },
            { createdBy: userId },
          ],
          select: ['id'],
        });
        const contractIds = contracts.map(c => c.id);
        if (contractIds.length > 0) {
          where.contractId = In(contractIds);
        } else {
          return { items: [], total: 0 };
        }
      }
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ["contract", "contract.customer"],
      order: { plannedDate: "ASC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 添加倒计时/超期天数和颜色标识
    const itemsWithStatus = items.map(item => this.addPaymentStatusInfo(item));

    return { items: itemsWithStatus, total };
  }

  /**
   * 添加回款状态信息（倒计时/超期天数和颜色）
   */
  private addPaymentStatusInfo(payment: PaymentPlan): any {
    const today = new Date();
    const plannedDate = new Date(payment.plannedDate);
    const diffDays = Math.ceil((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let statusColor = 'normal';
    let statusText = '';

    if (payment.status === PaymentStatus.COMPLETED) {
      statusColor = 'success';
      statusText = '已完成';
    } else if (diffDays < 0) {
      // 超期
      statusColor = 'danger';
      statusText = `超期${Math.abs(diffDays)}天`;
    } else if (diffDays <= 3) {
      // 即将到期（3天内）
      statusColor = 'warning';
      statusText = `剩余${diffDays}天`;
    } else if (diffDays <= 7) {
      // 一周内到期
      statusColor = 'info';
      statusText = `剩余${diffDays}天`;
    } else {
      statusText = `剩余${diffDays}天`;
    }

    return {
      ...payment,
      diffDays,
      statusColor,
      statusText,
    };
  }

  async findOne(id: string, userId?: string): Promise<PaymentPlan> {
    const p = await this.repo.findOne({ where: { id }, relations: ["contract", "contract.customer"] });
    if (!p) throw new NotFoundException("回款记录不存在");

    // 检查数据权限
    if (userId) {
      const canViewAll = await this.dataPermissionService.canViewAllData(userId);
      if (!canViewAll) {
        const contract = await this.contractRepo.findOne({ where: { id: p.contractId } });
        if (contract && contract.ownerId !== userId && contract.createdBy !== userId) {
          throw new ForbiddenException('无权访问该回款记录');
        }
      }
    }

    return this.addPaymentStatusInfo(p) as PaymentPlan;
  }

  async update(id: string, dto: any, userId: string): Promise<PaymentPlan> {
    const p = await this.findOne(id, userId);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("已确认的回款不能修改");

    // 检查权限：财务和系统管理员可以修改
    const isFinance = await this.dataPermissionService.isFinanceRole(userId);
    if (!isFinance) {
      throw new ForbiddenException('只有财务或系统管理员可以修改回款信息');
    }

    Object.assign(p, dto);
    await this.repo.save(p);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const p = await this.findOne(id, userId);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("已确认的回款不能删除");

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除回款记录');
    }

    await this.repo.remove(p);
  }

  /**
   * 确认回款
   */
  async confirm(id: string, actualDate: Date, userId: string): Promise<PaymentPlan> {
    const p = await this.findOne(id, userId);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("该回款已完成");

    // 检查权限：财务人员可以确认回款
    const isFinance = await this.dataPermissionService.isFinanceRole(userId);
    if (!isFinance) {
      throw new ForbiddenException('只有财务人员可以确认回款');
    }

    p.status = PaymentStatus.COMPLETED;
    p.actualDate = actualDate || new Date();
    p.confirmedBy = userId;
    await this.repo.save(p);
    return this.findOne(id);
  }

  /**
   * 驳回回款
   */
  async reject(id: string, reason: string, userId: string): Promise<PaymentPlan> {
    const p = await this.findOne(id, userId);

    // 检查权限：财务人员可以驳回回款
    const isFinance = await this.dataPermissionService.isFinanceRole(userId);
    if (!isFinance) {
      throw new ForbiddenException('只有财务人员可以驳回回款');
    }

    p.status = PaymentStatus.PENDING;
    if (reason) p.description = "[已拒绝] " + reason;
    await this.repo.save(p);
    return this.findOne(id);
  }

  /**
   * 获取逾期回款列表
   */
  async getOverduePayments(userId?: string): Promise<any[]> {
    const payments = await this.repo.createQueryBuilder("p")
      .leftJoinAndSelect("p.contract", "contract")
      .leftJoinAndSelect("contract.customer", "customer")
      .where("p.status = :s", { s: PaymentStatus.PENDING })
      .andWhere("p.planned_date < CURRENT_DATE")
      .orderBy("p.planned_date", "ASC")
      .getMany();

    // 添加状态信息
    return payments.map(p => this.addPaymentStatusInfo(p));
  }

  /**
   * 获取即将到期的回款列表
   */
  async getUpcomingPayments(days = 7, userId?: string): Promise<any[]> {
    const today = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);

    const payments = await this.repo.createQueryBuilder("p")
      .leftJoinAndSelect("p.contract", "contract")
      .leftJoinAndSelect("contract.customer", "customer")
      .where("p.status = :s", { s: PaymentStatus.PENDING })
      .andWhere("p.planned_date >= :today", { today })
      .andWhere("p.planned_date <= :target", { target })
      .orderBy("p.planned_date", "ASC")
      .getMany();

    // 添加状态信息
    return payments.map(p => this.addPaymentStatusInfo(p));
  }

  /**
   * 获取回款统计数据
   */
  async getPaymentStatistics(userId?: string) {
    const all = await this.repo.find();
    const total = all.reduce((s, p) => s + Number(p.amount), 0);
    const completed = all.filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((s, p) => s + Number(p.amount), 0);
    const pending = all.filter(p => p.status === PaymentStatus.PENDING)
      .reduce((s, p) => s + Number(p.amount), 0);

    const overduePayments = all.filter(p =>
      p.status === PaymentStatus.PENDING && new Date(p.plannedDate) < new Date()
    );
    const overdueAmount = overduePayments.reduce((s, p) => s + Number(p.amount), 0);

    return {
      totalAmount: total,
      completedAmount: completed,
      pendingAmount: pending,
      overdueAmount,
      completedCount: all.filter(p => p.status === PaymentStatus.COMPLETED).length,
      pendingCount: all.filter(p => p.status === PaymentStatus.PENDING).length,
      overdueCount: overduePayments.length,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * 财务登记实际回款
   * 由财务人员进行实际回款登记
   */
  async registerPayment(id: string, data: any, userId: string) {
    const payment = await this.findOne(id, userId);

    // 检查权限：只有财务人员可以登记回款
    const isFinance = await this.dataPermissionService.isFinanceRole(userId);
    if (!isFinance) {
      throw new ForbiddenException('只有财务人员可以登记回款');
    }

    // 更新回款信息
    payment.actualAmount = data.actualAmount || payment.amount;
    payment.actualDate = data.actualDate || new Date();
    payment.paymentMethod = data.paymentMethod; // 收款方式
    payment.accountInfo = data.accountInfo; // 账户信息
    payment.remark = data.remark; // 备注
    payment.status = PaymentStatus.COMPLETED;
    payment.confirmedBy = userId;

    await this.repo.save(payment);

    // 如果关联合同的回款节点，更新节点状态
    if (payment.paymentNodeId) {
      await this.paymentNodeRepo.update(payment.paymentNodeId, {
        status: 'paid',
        actualDate: payment.actualDate,
        actualAmount: payment.actualAmount,
      });
    }

    return this.findOne(id);
  }
}
