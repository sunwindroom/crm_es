import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { FollowUp } from '../../follow-up/entities/follow-up.entity';
import { Opportunity, OpportunityStatus } from '../../opportunity/entities/opportunity.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { FrequencyQueryDto, EffectivenessQueryDto } from '../dto/activity-query.dto';
import { FollowUpFrequency, FollowUpEffectiveness } from '../interfaces/activity-data.interface';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(FollowUp) private followUpRepo: Repository<FollowUp>,
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取跟进频率统计
   */
  async getFollowUpFrequency(user: User, query: FrequencyQueryDto): Promise<FollowUpFrequency[]> {
    // 1. 获取可访问的用户ID列表
    const userIds = await this.permissionService.getAccessibleUserIds(user);
    
    // 2. 构建时间过滤条件
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const dateFilter = startDate && endDate ? Between(startDate, endDate) : undefined;

    // 3. 查询跟进记录
    const where: any = { createdBy: In(userIds) };
    if (query.type) where.type = query.type;
    if (dateFilter) where.createdAt = dateFilter;

    const followUps = await this.followUpRepo.find({ where });

    // 4. 按用户分组统计
    const userMap = new Map<string, FollowUpFrequency>();

    followUps.forEach((f) => {
      const userId = f.createdBy;
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          userId,
          userName: '',
          totalCount: 0,
          byType: [],
          byObject: [],
        });
      }

      const userStat = userMap.get(userId)!;
      userStat.totalCount++;

      // 按类型统计
      const type = f.type;
      const typeStat = userStat.byType.find(t => t.type === type);
      if (typeStat) {
        typeStat.count++;
      } else {
        userStat.byType.push({ type, count: 1 });
      }

      // 按对象类型统计
      const objectType = f.objectType;
      const objectStat = userStat.byObject.find(o => o.objectType === objectType);
      if (objectStat) {
        objectStat.count++;
      } else {
        userStat.byObject.push({ objectType, count: 1 });
      }
    });

    // 5. 查询用户名称
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const result = Array.from(userMap.values());
    result.forEach(stat => {
      const u = users.find(user => user.id === stat.userId);
      stat.userName = u?.name || '';
    });

    return result;
  }

  /**
   * 获取跟进效果分析
   */
  async getFollowUpEffectiveness(user: User, query: EffectivenessQueryDto): Promise<FollowUpEffectiveness> {
    // 1. 获取可访问的用户ID列表
    const userIds = await this.permissionService.getAccessibleUserIds(user);
    
    // 2. 查询商机
    const opportunities = await this.opportunityRepo
      .createQueryBuilder('o')
      .where('o.ownerId IN (:...userIds)', { userIds })
      .getMany();

    // 3. 查询商机的跟进记录数
    const opportunityIds = opportunities.map(o => o.id);
    let totalFollowUpCount = 0;
    
    if (opportunityIds.length > 0) {
      const followUps = await this.followUpRepo
        .createQueryBuilder('f')
        .where('f.objectType = :type', { type: 'opportunity' })
        .andWhere('f.objectId IN (:...opportunityIds)', { opportunityIds })
        .getMany();
      
      totalFollowUpCount = followUps.length;
    }
    
    const avgFollowUpCount = opportunities.length > 0 ? totalFollowUpCount / opportunities.length : 0;

    // 4. 计算转化率
    const wonOpportunities = opportunities.filter(o => o.status === OpportunityStatus.WON);
    const conversionRate = opportunities.length > 0 ? (wonOpportunities.length / opportunities.length) * 100 : 0;

    // 5. 找出表现最好的用户
    const userPerformanceMap = new Map<string, {
      conversionCount: number;
    }>();

    opportunities.forEach((o) => {
      const userId = o.ownerId;
      if (!userPerformanceMap.has(userId)) {
        userPerformanceMap.set(userId, {
          conversionCount: 0,
        });
      }

      const perf = userPerformanceMap.get(userId)!;
      if (o.status === OpportunityStatus.WON) {
        perf.conversionCount++;
      }
    });

    // 6. 构建表现最好的用户列表
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    
    // 查询所有跟进记录
    const allFollowUps = opportunityIds.length > 0 
      ? await this.followUpRepo
          .createQueryBuilder('f')
          .where('f.objectType = :type', { type: 'opportunity' })
          .andWhere('f.objectId IN (:...opportunityIds)', { opportunityIds })
          .getMany()
      : [];
    
    const topPerformers = Array.from(userPerformanceMap.entries())
      .map(([userId, perf]) => {
        const u = users.find(user => user.id === userId);
        const userOpps = opportunities.filter(o => o.ownerId === userId);
        const conversionRate = userOpps.length > 0 ? (perf.conversionCount / userOpps.length) * 100 : 0;
        
        // 计算该用户的跟进次数
        const userOppIds = userOpps.map(o => o.id);
        const userFollowUpCount = allFollowUps.filter(f => userOppIds.includes(f.objectId)).length;

        return {
          userId,
          userName: u?.name || '',
          followUpCount: userFollowUpCount,
          conversionCount: perf.conversionCount,
          conversionRate,
        };
      })
      .sort((a, b) => b.conversionRate - a.conversionRate)
      .slice(0, 10);

    return {
      resourceType: query.resourceType || 'opportunity',
      avgFollowUpCount,
      conversionRate,
      topPerformers,
    };
  }
}
