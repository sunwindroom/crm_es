import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Opportunity, OpportunityStage, OpportunityStatus } from '../../opportunity/entities/opportunity.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { SalesFunnelQueryDto, ConversionRateQueryDto } from '../dto/sales-funnel-query.dto';
import { SalesFunnelData, ConversionRateData } from '../interfaces/sales-funnel-data.interface';

@Injectable()
export class SalesFunnelService {
  constructor(
    @InjectRepository(Opportunity) private opportunityRepo: Repository<Opportunity>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取销售漏斗数据
   */
  async getSalesFunnel(user: User, query: SalesFunnelQueryDto): Promise<SalesFunnelData[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'opportunity');
    
    // 2. 构建时间过滤条件
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const dateFilter = startDate && endDate ? Between(startDate, endDate) : undefined;

    // 3. 定义阶段
    const stages = [
      { stage: OpportunityStage.INITIAL, name: '初步接触', probability: 20 },
      { stage: OpportunityStage.REQUIREMENT, name: '需求确认', probability: 40 },
      { stage: OpportunityStage.PROPOSAL, name: '方案报价', probability: 60 },
      { stage: OpportunityStage.NEGOTIATION, name: '商务谈判', probability: 80 },
      { stage: OpportunityStage.CONTRACT, name: '签订合同', probability: 90 },
    ];

    // 4. 并行查询各阶段数据
    const funnelData = await Promise.all(
      stages.map(async (s) => {
        const where: any = {
          ...permissionFilter,
          stage: s.stage,
          status: OpportunityStatus.ACTIVE,
        };

        if (query.industry) {
          // 需要关联客户表查询行业
          const opportunities = await this.opportunityRepo
            .createQueryBuilder('o')
            .leftJoinAndSelect('o.customer', 'c')
            .where('o.stage = :stage', { stage: s.stage })
            .andWhere('o.status = :status', { status: OpportunityStatus.ACTIVE })
            .andWhere('c.industry = :industry', { industry: query.industry })
            .getMany();
          
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
        } else {
          const opportunities = await this.opportunityRepo.find({ where });
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
        }
      })
    );

    return funnelData;
  }

  /**
   * 获取阶段转化率数据
   */
  async getConversionRate(user: User, query: ConversionRateQueryDto): Promise<ConversionRateData[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'opportunity');
    
    // 2. 查询商机阶段变更历史
    // 注意: 需要确保数据库中有opportunity_stage_histories表
    const stageHistories = await this.opportunityRepo.manager.query(`
      SELECT 
        from_stage,
        to_stage,
        COUNT(*) as count,
        AVG(EXTRACT(DAY FROM (changed_at - LAG(changed_at) OVER (PARTITION BY opportunity_id ORDER BY changed_at)))) as avg_duration
      FROM opportunity_stage_histories
      WHERE opportunity_id IN (
        SELECT id FROM opportunities 
        WHERE owner_id = $1
      )
      GROUP BY from_stage, to_stage
      ORDER BY to_stage
    `, [permissionFilter.ownerId || user.id]);

    // 3. 计算转化率
    const conversionRates: ConversionRateData[] = [];
    
    for (const history of stageHistories) {
      // 查询该阶段的商机总数
      const fromStageCount = await this.opportunityRepo.count({
        where: {
          ...permissionFilter,
          stage: history.from_stage,
          status: OpportunityStatus.ACTIVE,
        },
      });

      const rate = fromStageCount > 0 ? (history.count / fromStageCount) * 100 : 0;

      conversionRates.push({
        fromStage: history.from_stage,
        toStage: history.to_stage,
        count: history.count,
        rate,
        avgDuration: history.avg_duration || 0,
      });
    }

    return conversionRates;
  }
}
