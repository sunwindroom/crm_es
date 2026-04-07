import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer } from './entities/customer.entity';
import { Contact } from './entities/contact.entity';
import { CustomerVisit } from './entities/customer-visit.entity';
import { FollowUp } from '../follow-up/entities/follow-up.entity';
import { User } from '../user/entities/user.entity';
import { HandoverModule } from '../handover/handover.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Contact, CustomerVisit, FollowUp, User]),
    HandoverModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}