import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';
import { Milestone } from './entities/milestone.entity';
@Module({ imports: [TypeOrmModule.forFeature([Project, Milestone])], controllers: [ProjectController], providers: [ProjectService], exports: [ProjectService] })
export class ProjectModule {}
