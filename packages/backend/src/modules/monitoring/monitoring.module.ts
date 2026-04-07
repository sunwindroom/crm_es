import { Module } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { MonitoringController } from './monitoring.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  controllers: [MonitoringController],
  providers: [MonitoringService],
  exports: [MonitoringService],
})
export class MonitoringModule {}
