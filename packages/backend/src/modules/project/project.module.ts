import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { Milestone } from './entities/milestone.entity';
import { ProjectTimesheet } from './entities/project-timesheet.entity';
import { ProjectMember } from './entities/project-member.entity';
import { User } from '../user/entities/user.entity';
import { HandoverModule } from '../handover/handover.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Milestone,
      ProjectTimesheet,
      ProjectMember,
      User,
    ]),
    HandoverModule,
    NotificationModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService]
})
export class ProjectModule {}
