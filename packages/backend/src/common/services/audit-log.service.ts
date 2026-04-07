import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  AuditLog,
  AuditAction,
  AuditResource,
} from '../../modules/audit/entities/audit-log.entity';

export interface CreateAuditLogDto {
  userId: string;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  remark?: string;
  ip: string;
  userAgent: string;
}

export interface QueryAuditLogDto {
  userId?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * 记录审计日志
   */
  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(dto);
    return await this.auditLogRepository.save(auditLog);
  }

  /**
   * 批量记录审计日志
   */
  async logBatch(dtos: CreateAuditLogDto[]): Promise<AuditLog[]> {
    const auditLogs = this.auditLogRepository.create(dtos);
    return await this.auditLogRepository.save(auditLogs);
  }

  /**
   * 查询审计日志
   */
  async query(dto: QueryAuditLogDto): Promise<{ items: AuditLog[]; total: number }> {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = dto;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    // 关联用户信息
    queryBuilder.leftJoinAndSelect('audit_log.user', 'user');

    // 添加过滤条件
    if (userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId });
    }
    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }
    if (resource) {
      queryBuilder.andWhere('audit_log.resource = :resource', { resource });
    }
    if (resourceId) {
      queryBuilder.andWhere('audit_log.resourceId = :resourceId', { resourceId });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('audit_log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    // 排序
    queryBuilder.orderBy('audit_log.createdAt', 'DESC');

    // 分页
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  /**
   * 根据ID查询审计日志详情
   */
  async findById(id: string): Promise<AuditLog> {
    return await this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  /**
   * 获取用户的操作历史
   */
  async getUserHistory(
    userId: string,
    options?: { startDate?: Date; endDate?: Date; limit?: number },
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.userId = :userId', { userId })
      .orderBy('audit_log.createdAt', 'DESC');

    if (options?.startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', {
        startDate: options.startDate,
      });
    }
    if (options?.endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', {
        endDate: options.endDate,
      });
    }
    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * 获取资源的操作历史
   */
  async getResourceHistory(
    resource: AuditResource,
    resourceId: string,
    limit?: number,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.resource = :resource', { resource })
      .andWhere('audit_log.resourceId = :resourceId', { resourceId })
      .leftJoinAndSelect('audit_log.user', 'user')
      .orderBy('audit_log.createdAt', 'DESC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    return await queryBuilder.getMany();
  }

  /**
   * 统计权限校验失败次数
   */
  async countPermissionDenied(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.action = :action', {
        action: AuditAction.PERMISSION_DENIED,
      });

    if (userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId });
    }
    if (startDate) {
      queryBuilder.andWhere('audit_log.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('audit_log.createdAt <= :endDate', { endDate });
    }

    return await queryBuilder.getCount();
  }

  /**
   * 清理过期的审计日志
   */
  async cleanExpiredLogs(retentionDays: number = 90): Promise<number> {
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() - retentionDays);

    const result = await this.auditLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :expireDate', { expireDate })
      .execute();

    return result.affected || 0;
  }
}
