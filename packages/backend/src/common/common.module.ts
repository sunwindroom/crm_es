import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/user/entities/user.entity';
import { Project } from '../modules/project/entities/project.entity';
import { ProjectMember } from '../modules/project/entities/project-member.entity';
import { DataPermissionService } from './services/data-permission.service';
import { PermissionCacheService } from './services/permission-cache.service';
import { AuditLogService } from './services/audit-log.service';
import { AuditLog } from '../modules/audit/entities/audit-log.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Project, ProjectMember, AuditLog])
  ],
  providers: [DataPermissionService, PermissionCacheService, AuditLogService],
  exports: [DataPermissionService, PermissionCacheService, AuditLogService]
})
export class CommonModule {}
