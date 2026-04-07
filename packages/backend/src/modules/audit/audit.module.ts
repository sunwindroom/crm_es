import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuditController } from './audit.controller';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, User])],
  controllers: [AuditController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
