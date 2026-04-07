import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadExtensionService } from './lead-extension.service';
import { LeadHandoverService } from './lead-handover.service';
import { Lead } from './entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';
import { Opportunity } from '../opportunity/entities/opportunity.entity';
import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { Handover } from '../handover/entities/handover.entity';
import { HandoverModule } from '../handover/handover.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Customer, Opportunity, User, Project, Handover]),
    HandoverModule,
    NotificationModule
  ],
  controllers: [LeadController],
  providers: [LeadService, LeadExtensionService, LeadHandoverService],
  exports: [LeadService, LeadExtensionService, LeadHandoverService]
})
export class LeadModule {}
