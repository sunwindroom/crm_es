import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentPlan, PaymentStatus } from "./entities/payment-plan.entity";

@Injectable()
export class PaymentService {
  constructor(@InjectRepository(PaymentPlan) private repo: Repository<PaymentPlan>) {}

  async create(dto: any): Promise<PaymentPlan> {
    const entity = this.repo.create(dto);
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, status, contractId } = q;
    const where: any = {};
    if (status) where.status = status;
    if (contractId) where.contractId = contractId;

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ["contract", "contract.customer"],
      order: { plannedDate: "ASC" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<PaymentPlan> {
    const p = await this.repo.findOne({ where: { id }, relations: ["contract"] });
    if (!p) throw new NotFoundException("回款记录不存在");
    return p;
  }

  async update(id: string, dto: any): Promise<PaymentPlan> {
    const p = await this.findOne(id);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("已确认的回款不能修改");
    Object.assign(p, dto);
    await this.repo.save(p);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const p = await this.findOne(id);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("已确认的回款不能删除");
    await this.repo.remove(p);
  }

  async confirm(id: string, actualDate?: Date): Promise<PaymentPlan> {
    const p = await this.findOne(id);
    if (p.status === PaymentStatus.COMPLETED) throw new BadRequestException("该回款已完成");
    p.status = PaymentStatus.COMPLETED;
    p.actualDate = actualDate || new Date();
    await this.repo.save(p);
    return this.findOne(id);
  }

  async reject(id: string, reason?: string): Promise<PaymentPlan> {
    const p = await this.findOne(id);
    p.status = PaymentStatus.PENDING;
    if (reason) p.description = "[已拒绝] " + reason;
    await this.repo.save(p);
    return this.findOne(id);
  }

  async getOverduePayments(): Promise<PaymentPlan[]> {
    return this.repo.createQueryBuilder("p")
      .where("p.status = :s", { s: PaymentStatus.PENDING })
      .andWhere("p.planned_date < CURRENT_DATE")
      .getMany();
  }

  async getUpcomingPayments(days = 7): Promise<PaymentPlan[]> {
    const today = new Date();
    const target = new Date();
    target.setDate(target.getDate() + days);
    return this.repo.createQueryBuilder("p")
      .where("p.status = :s", { s: PaymentStatus.PENDING })
      .andWhere("p.planned_date >= :today", { today })
      .andWhere("p.planned_date <= :target", { target })
      .getMany();
  }

  async getPaymentStatistics() {
    const all = await this.repo.find();
    const total = all.reduce((s, p) => s + Number(p.amount), 0);
    const completed = all.filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((s, p) => s + Number(p.amount), 0);
    const pending = all.filter(p => p.status === PaymentStatus.PENDING)
      .reduce((s, p) => s + Number(p.amount), 0);
    const overdueCount = all.filter(p =>
      p.status === PaymentStatus.PENDING && new Date(p.plannedDate) < new Date()
    ).length;
    return {
      totalAmount: total, completedAmount: completed, pendingAmount: pending,
      completedCount: all.filter(p => p.status === PaymentStatus.COMPLETED).length,
      pendingCount: all.filter(p => p.status === PaymentStatus.PENDING).length,
      overdueCount,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}
