import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController, PaymentPlanController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentPlan } from './entities/payment-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentPlan])],
  controllers: [PaymentController, PaymentPlanController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
