import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Lead, LeadStatus } from './entities/lead.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { User, UserRole } from '../user/entities/user.entity';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

function toUuid(val: any): string | undefined {
  if (!val || String(val).trim() === '') return undefined;
  return String(val);
}

@Injectable()
export class LeadService {
  constructor(
    @InjectRepository(Lead) private repo: Repository<Lead>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataPermissionService: DataPermissionService,
    private auditLogService: AuditLogService,
  ) {}

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

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, status, source, keyword } = q;
    const base: any = {};
    if (status) base.status = status;
    if (source) base.source = source;

    // 添加数据权限过滤
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      // 如果返回null，表示管理员，不过滤
      if (accessibleIds !== null) {
        base.assignedTo = In(accessibleIds);
      }
    }

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

  async findOne(id: string, userId?: string): Promise<Lead> {
    const lead = await this.safeLoadLead(id);

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(lead.assignedTo || '')) {
        throw new ForbiddenException('无权访问该线索');
      }
    }

    return lead;
  }

  async update(id: string, dto: any, userId: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 检查权限：只有系统管理员、总裁或营销副总裁可以编辑
    const canEdit = await this.dataPermissionService.canEditAllData(userId);
    if (!canEdit) {
      throw new ForbiddenException('只有系统管理员、总裁或营销副总裁可以编辑线索');
    }

    // 清理空 UUID 字段
    if ('assignedTo' in dto) dto.assignedTo = toUuid(dto.assignedTo);
    if ('createdBy' in dto) dto.createdBy = toUuid(dto.createdBy);

    Object.assign(lead, dto);
    await this.repo.save(lead);
    return this.safeLoadLead(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除线索');
    }

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

  async markAsLost(id: string, reason: string, userId: string): Promise<Lead> {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 检查数据权限
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    if (accessibleIds !== null && !accessibleIds.includes(lead.assignedTo || '')) {
      throw new ForbiddenException('无权操作该线索');
    }

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

  // ── 线索跟踪记录 ────────────────────────────────────────────────────────
  async addFollowUp(leadId: string, data: any, userId: string) {
    const lead = await this.repo.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 检查数据权限：上下级都可以填写跟进记录
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    
    // 如果accessibleIds为null，说明是管理员，可以访问所有数据
    if (accessibleIds === null) {
      // 管理员可以添加跟进记录
    } else {
      // 检查线索负责人是否在当前用户的可访问范围内
      const leadOwnerId = lead.assignedTo || lead.ownerId || lead.createdBy;
      if (!accessibleIds.includes(leadOwnerId)) {
        throw new ForbiddenException('无权为该线索添加跟进记录');
      }
    }

    // 使用原生SQL插入跟踪记录
    const result = await this.repo.query(
      `INSERT INTO lead_follow_ups (id, lead_id, content, next_action, created_by, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING *`,
      [leadId, data.content, data.nextAction || null, userId]
    );

    return result[0];
  }

  async getFollowUps(leadId: string, userId?: string) {
    const lead = await this.repo.findOne({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('线索不存在');

    // 检查数据权限：上下级都可以查看跟进记录
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      
      // 如果accessibleIds为null，说明是管理员，可以访问所有数据
      if (accessibleIds !== null) {
        // 检查线索负责人是否在当前用户的可访问范围内
        const leadOwnerId = lead.assignedTo || lead.ownerId || lead.createdBy;
        if (!accessibleIds.includes(leadOwnerId)) {
          throw new ForbiddenException('无权查看该线索的跟进记录');
        }
      }
    }

    // 使用原生SQL查询跟踪记录
    const followUps = await this.repo.query(
      `SELECT f.*, u.name as creator_name
       FROM lead_follow_ups f
       LEFT JOIN users u ON f.created_by = u.id
       WHERE f.lead_id = $1
       ORDER BY f.created_at DESC`,
      [leadId]
    );

    return followUps;
  }
}
