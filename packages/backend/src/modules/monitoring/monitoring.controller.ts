import { Controller, Get, Post, Body, Patch } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Public()
  @Get('metrics')
  getCurrentMetrics() {
    return this.monitoringService.getCurrentMetrics();
  }

  @Public()
  @Get('metrics/history')
  getMetricsHistory(@Body('minutes') minutes?: number) {
    return this.monitoringService.getMetricsHistory(minutes);
  }

  @Public()
  @Get('system')
  getSystemInfo() {
    return this.monitoringService.getSystemInfo();
  }

  @Post('alerts/config')
  updateAlertConfig(@Body() config: any) {
    return this.monitoringService.updateAlertConfig(config);
  }

  @Post('alerts/thresholds')
  updateThresholds(@Body() thresholds: any) {
    return this.monitoringService.updateThresholds(thresholds);
  }
}
