import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from './entities/contract.entity';
import { PaymentNode } from './entities/payment-node.entity';
import { User } from '../user/entities/user.entity';
import { Project } from '../project/entities/project.entity';
import { HandoverModule } from '../handover/handover.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract,
      PaymentNode,
      User,
      Project,
    ]),
    HandoverModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService]
})
export class ContractModule {}