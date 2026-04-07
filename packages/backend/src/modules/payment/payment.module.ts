import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController, PaymentPlanController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentPlan } from './entities/payment-plan.entity';
import { PaymentNode } from '../contract/entities/payment-node.entity';
import { User } from '../user/entities/user.entity';
import { Contract } from '../contract/entities/contract.entity';
import { HandoverModule } from '../handover/handover.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentPlan,
      PaymentNode,
      User,
      Contract,
    ]),
    HandoverModule,
  ],
  controllers: [PaymentController, PaymentPlanController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
