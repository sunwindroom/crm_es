import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Lead } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { Project } from '../project/entities/project.entity';
import { Contract } from '../contract/entities/contract.entity';
import { PaymentPlan } from '../payment/entities/payment-plan.entity';
import { Milestone } from '../project/entities/milestone.entity';
import { ProjectTimesheet } from '../project/entities/project-timesheet.entity';
import { User } from '../user/entities/user.entity';
import { FollowUp } from '../follow-up/entities/follow-up.entity';
import { CustomerVisit } from '../customer/entities/customer-visit.entity';

// 新增服务
import { DataPermissionService } from './services/data-permission.service';
import { DashboardService } from './services/dashboard.service';
import { SalesFunnelService } from './services/sales-funnel.service';
import { PerformanceService } from './services/performance.service';
import { CustomerAnalysisService } from './services/customer-analysis.service';
import { PaymentStatsService } from './services/payment-stats.service';
import { ProjectStatsService } from './services/project-stats.service';
import { ActivityService } from './services/activity.service';

// 新增Controller
import { DashboardController } from './controllers/dashboard.controller';
import { SalesFunnelController } from './controllers/sales-funnel.controller';
import { PerformanceController } from './controllers/performance.controller';
import { CustomerAnalysisController } from './controllers/customer-analysis.controller';
import { PaymentStatsController } from './controllers/payment-stats.controller';
import { ProjectStatsController } from './controllers/project-stats.controller';
import { ActivityController } from './controllers/activity.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Lead,
      Customer,
      Opportunity,
      Project,
      Contract,
      PaymentPlan,
      Milestone,
      ProjectTimesheet,
      User,
      FollowUp,
      CustomerVisit,
    ]),
  ],
  controllers: [
    ReportController,
    DashboardController,
    SalesFunnelController,
    PerformanceController,
    CustomerAnalysisController,
    PaymentStatsController,
    ProjectStatsController,
    ActivityController,
  ],
  providers: [
    ReportService,
    DataPermissionService,
    DashboardService,
    SalesFunnelService,
    PerformanceService,
    CustomerAnalysisService,
    PaymentStatsService,
    ProjectStatsService,
    ActivityService,
  ],
  exports: [
    ReportService,
    DataPermissionService,
    DashboardService,
    SalesFunnelService,
    PerformanceService,
    CustomerAnalysisService,
    PaymentStatsService,
    ProjectStatsService,
    ActivityService,
  ],
})
export class ReportModule {}
