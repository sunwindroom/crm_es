import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpportunityController } from './opportunity.controller';
import { OpportunityService } from './opportunity.service';
import { OpportunityExtensionService } from './opportunity-extension.service';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunityFollowUp } from './entities/opportunity-follow-up.entity';
import { Project } from '../project/entities/project.entity';
import { Contract } from '../contract/entities/contract.entity';
import { PaymentPlan } from '../payment/entities/payment-plan.entity';
import { User } from '../user/entities/user.entity';
import { Customer } from '../customer/entities/customer.entity';
import { HandoverModule } from '../handover/handover.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Opportunity,
      OpportunityFollowUp,
      Project,
      Contract,
      PaymentPlan,
      User,
      Customer,
    ]),
    HandoverModule,
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService, OpportunityExtensionService],
  exports: [OpportunityService, OpportunityExtensionService]
})
export class OpportunityModule {}
