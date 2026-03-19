import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';

function toUuid(val: any): string | undefined {
  if (!val || String(val).trim() === '') return undefined;
  return String(val);
}

@Injectable()
export class LeadService {
  constructor(@InjectRepository(Lead) private repo: Repository<Lead>) {}

  async create(dto: any, userId: string): Promise<Lead> {
    const assignedTo = toUuid(dto.assignedTo) || userId;
    const createdBy  = toUuid(userId);

    const entity = this.repo.create({
      name:        dto.name,
      company:     dto.company,
      phone:       dto.phone,
      email:       dto.email        || undefined,
      source:      dto.source       || undefined,
      industry:    dto.industry     || undefined,
      region:      dto.region       || undefined,
      requirement: dto.requirement  || undefined,
      budget:      dto.budget       || undefined,
      department:  dto.department   || undefined,
      remark:      dto.remark       || undefined,
      status:      dto.status       || 'new',
      assignedTo,
      assignedAt:  new Date(),
      createdBy,
    });

    // 1. 先保存，不加载关联
    const saved = await this.repo.save(entity);

    // 2. 用保存后的真实 ID 重新查询（不带 relations，避免空 UUID 问题）
    const leadId = (saved as any).id;
    if (!leadId || leadId === '') {
      throw new BadRequestException('保存失败：无法获取线索ID');
    }

    // 3. 用 findOneBy 安全加载，如果外键为空则跳过关联加载
    return this.safeLoadLead(leadId);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, status, source, keyword } = q;
    const base: any = {};
    if (status) base.status = status;
    if (source) base.source = source;

    let where: any = base;
    if (keyword) {
      where = [
        { ...base, name: Like(`%${keyword}%`) },
        { ...base, company: Like(`%${keyword}%`) },
        { ...base, phone: Like(`%${keyword}%`) },
      ];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    // 先不带 relations 查 ID 列表，避免空 UUID 触发 IN("") bug
    const leads = await this.repo.find({
      where,
      select: ['id', 'assignedTo', 'createdBy'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const items = await Promise.all(leads.map(l => this.safeLoadLead(l.id)));
    return { items, total };
  }

  async findOne(id: string): Promise<Lead> {
    return this.safeLoadLead(id);
  }

  async update(id: string, dto: any): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 清理空 UUID 字段
    if ('assignedTo' in dto) dto.assignedTo = toUuid(dto.assignedTo);
    if ('createdBy' in dto) dto.createdBy = toUuid(dto.createdBy);

    Object.assign(lead, dto);
    await this.repo.save(lead);
    return this.safeLoadLead(id);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');
    await this.repo.remove(lead);
  }

  async assign(id: string, userId: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');
    lead.assignedTo = userId;
    lead.assignedAt = new Date();
    await this.repo.save(lead);
    return this.safeLoadLead(id);
  }

  async batchAssign(ids: string[], userId: string): Promise<void> {
    if (!ids?.length) return;
    await this.repo
      .createQueryBuilder()
      .update(Lead)
      .set({ assignedTo: userId, assignedAt: new Date() })
      .whereInIds(ids)
      .execute();
  }

  async convert(id: string, data: any): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');
    if (lead.status === LeadStatus.CONVERTED) throw new BadRequestException('线索已转化');
    lead.status = LeadStatus.CONVERTED;
    await this.repo.save(lead);
    return this.safeLoadLead(id);
  }

  async markAsLost(id: string, reason: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');
    lead.status = LeadStatus.LOST;
    lead.lostReason = reason;
    await this.repo.save(lead);
    return this.safeLoadLead(id);
  }

  // ── 安全加载：只有外键有效时才加载关联，彻底避免 IN("") ──────────────
  private async safeLoadLead(id: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');

    const relations: string[] = [];
    if (lead.assignedTo && lead.assignedTo !== '') relations.push('assignedUser');
    if (lead.createdBy  && lead.createdBy  !== '') relations.push('creator');

    if (relations.length === 0) return lead;

    return this.repo.findOne({ where: { id }, relations }) as Promise<Lead>;
  }
}
