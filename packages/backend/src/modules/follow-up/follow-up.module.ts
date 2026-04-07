import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpController } from './follow-up.controller';
import { FollowUpService } from './follow-up.service';
import { FollowUp } from './entities/follow-up.entity';
import { Lead } from '../lead/entities/lead.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUp, Lead, User])],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
