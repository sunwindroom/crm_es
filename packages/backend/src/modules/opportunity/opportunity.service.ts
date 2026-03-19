import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityStatus } from './entities/opportunity.entity';

@Injectable()
export class OpportunityService {
  constructor(@InjectRepository(Opportunity) private repo: Repository<Opportunity>) {}

  async create(dto: any, userId: string): Promise<Opportunity> {
    if (dto.leadId === '') dto.leadId = undefined;
    if (dto.customerId === '') dto.customerId = undefined;
    if (dto.ownerId === '') dto.ownerId = undefined;
    const entity = this.repo.create({ ...dto, createdBy: userId, ownerId: dto.ownerId || userId });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, stage, status, customerId, keyword } = q;
    const base: any = {};
    if (stage) base.stage = stage;
    if (status) base.status = status;
    if (customerId) base.customerId = customerId;

    let where: any = base;
    if (keyword) {
      where = [{ ...base, name: Like(`%${keyword}%`) }];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ['customer', 'owner'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<Opportunity> {
    const o = await this.repo.findOne({ where: { id }, relations: ['customer', 'owner', 'creator'] });
    if (!o) throw new NotFoundException('商机不存在');
    return o;
  }

  async update(id: string, dto: any): Promise<Opportunity> {
    const o = await this.findOne(id);
    Object.assign(o, dto);
    await this.repo.save(o);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.remove(await this.findOne(id));
  }

  async updateStage(id: string, stage: OpportunityStage): Promise<Opportunity> {
    const o = await this.findOne(id);
    const probMap: any = { initial:20, requirement:40, proposal:60, negotiation:80, contract:90 };
    o.stage = stage;
    o.probability = probMap[stage] || 20;
    await this.repo.save(o);
    return this.findOne(id);
  }

  async markAsWon(id: string): Promise<Opportunity> {
    const o = await this.findOne(id);
    o.status = OpportunityStatus.WON;
    o.probability = 100;
    await this.repo.save(o);
    return this.findOne(id);
  }

  async markAsLost(id: string, reason?: string): Promise<Opportunity> {
    const o = await this.findOne(id);
    o.status = OpportunityStatus.LOST;
    o.probability = 0;
    o.lostReason = reason || '';
    await this.repo.save(o);
    return this.findOne(id);
  }

  async getSalesFunnel() {
    const opps = await this.repo.find({ where: { status: OpportunityStatus.ACTIVE } });
    const stages = ['initial','requirement','proposal','negotiation','contract'];
    return stages.map(stage => ({
      stage,
      count: opps.filter(o => o.stage === stage).length,
      totalAmount: opps.filter(o => o.stage === stage).reduce((s, o) => s + Number(o.amount), 0),
    }));
  }

  async getSalesForecast() {
    const opps = await this.repo.find({ where: { status: OpportunityStatus.ACTIVE } });
    return {
      totalAmount: opps.reduce((s, o) => s + Number(o.amount), 0),
      weightedAmount: opps.reduce((s, o) => s + Number(o.amount) * o.probability / 100, 0),
      count: opps.length,
    };
  }
}
