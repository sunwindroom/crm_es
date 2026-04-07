import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandoverService } from './handover.service';
import { HandoverController } from './handover.controller';
import { Handover } from './entities/handover.entity';
import { User } from '../user/entities/user.entity';
import { Lead } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { Project } from '../project/entities/project.entity';
import { Contract } from '../contract/entities/contract.entity';
import { PaymentPlan } from '../payment/entities/payment-plan.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Handover,
      User,
      Lead,
      Customer,
      Opportunity,
      Project,
      Contract,
      PaymentPlan,
    ]),
  ],
  controllers: [HandoverController],
  providers: [HandoverService],
  exports: [HandoverService],
})
export class HandoverModule {}
