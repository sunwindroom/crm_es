import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { User } from '../user/entities/user.entity';
import { Lead } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Lead, Customer])
  ],
  controllers: [HealthController],
})
export class HealthModule {}
