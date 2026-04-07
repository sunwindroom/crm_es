import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as os from 'os';

export interface AlertConfig {
  enabled: boolean;
  webhookUrl?: string;
  email?: string;
  slackWebhook?: string;
}

export interface MetricData {
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
  activeConnections: number;
  errorRate: number;
  responseTime: number;
}

export interface AlertThresholds {
  cpuCritical: number;
  cpuWarning: number;
  memoryCritical: number;
  memoryWarning: number;
  diskCritical: number;
  diskWarning: number;
  errorRateCritical: number;
  responseTimeCritical: number;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private metricsHistory: MetricData[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;
  private errorCount = 0;
  private totalRequests = 0;
  private responseTimes: number[] = [];

  private alertConfig: AlertConfig = {
    enabled: true,
    webhookUrl: process.env.ALERT_WEBHOOK_URL,
    email: process.env.ALERT_EMAIL,
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
  };

  private thresholds: AlertThresholds = {
    cpuCritical: 90,
    cpuWarning: 75,
    memoryCritical: 90,
    memoryWarning: 75,
    diskCritical: 90,
    diskWarning: 80,
    errorRateCritical: 5,
    responseTimeCritical: 3000,
  };

  constructor(private readonly httpService: HttpService) {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    this.logger.log('监控系统初始化完成');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics() {
    try {
      const metrics: MetricData = {
        timestamp: new Date(),
        cpu: this.getCpuUsage(),
        memory: this.getMemoryUsage(),
        disk: this.getDiskUsage(),
        uptime: process.uptime(),
        activeConnections: this.getActiveConnections(),
        errorRate: this.getErrorRate(),
        responseTime: this.getAverageResponseTime(),
      };

      this.metricsHistory.push(metrics);

      // 保持历史记录大小
      if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
        this.metricsHistory.shift();
      }

      // 检查告警条件
      await this.checkAlerts(metrics);

      this.logger.debug('指标收集完成', metrics);
    } catch (error) {
      this.logger.error('指标收集失败', error);
    }
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    const loadAverage = os.loadavg()[0];
    return Math.round((loadAverage / cpus.length) * 100);
  }

  private getMemoryUsage(): number {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    return Math.round((usedMemory / totalMemory) * 100);
  }

  private getDiskUsage(): number {
    // 简化版本,实际应该检查项目目录的磁盘使用情况
    return 50; // 占位符
  }

  private getActiveConnections(): number {
    // 简化版本,实际应该从数据库连接池获取
    return 1;
  }

  private getErrorRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.errorCount / this.totalRequests) * 100;
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return sum / this.responseTimes.length;
  }

  private async checkAlerts(metrics: MetricData) {
    const alerts = [];

    // CPU 告警
    if (metrics.cpu >= this.thresholds.cpuCritical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'CPU',
        message: `CPU 使用率过高: ${metrics.cpu}%`,
        value: metrics.cpu,
        threshold: this.thresholds.cpuCritical,
      });
    } else if (metrics.cpu >= this.thresholds.cpuWarning) {
      alerts.push({
        level: 'WARNING',
        type: 'CPU',
        message: `CPU 使用率警告: ${metrics.cpu}%`,
        value: metrics.cpu,
        threshold: this.thresholds.cpuWarning,
      });
    }

    // 内存告警
    if (metrics.memory >= this.thresholds.memoryCritical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'Memory',
        message: `内存使用率过高: ${metrics.memory}%`,
        value: metrics.memory,
        threshold: this.thresholds.memoryCritical,
      });
    } else if (metrics.memory >= this.thresholds.memoryWarning) {
      alerts.push({
        level: 'WARNING',
        type: 'Memory',
        message: `内存使用率警告: ${metrics.memory}%`,
        value: metrics.memory,
        threshold: this.thresholds.memoryWarning,
      });
    }

    // 错误率告警
    if (metrics.errorRate >= this.thresholds.errorRateCritical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'ErrorRate',
        message: `错误率过高: ${metrics.errorRate.toFixed(2)}%`,
        value: metrics.errorRate,
        threshold: this.thresholds.errorRateCritical,
      });
    }

    // 响应时间告警
    if (metrics.responseTime >= this.thresholds.responseTimeCritical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'ResponseTime',
        message: `响应时间过长: ${metrics.responseTime}ms`,
        value: metrics.responseTime,
        threshold: this.thresholds.responseTimeCritical,
      });
    }

    // 发送告警
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  private async sendAlert(alert: any) {
    if (!this.alertConfig.enabled) return;

    try {
      // 发送到 Webhook
      if (this.alertConfig.webhookUrl) {
        await this.sendWebhookAlert(alert);
      }

      // 发送到 Slack
      if (this.alertConfig.slackWebhook) {
        await this.sendSlackAlert(alert);
      }

      this.logger.warn(`告警已发送: ${alert.message}`);
    } catch (error) {
      this.logger.error('告警发送失败', error);
    }
  }

  private async sendWebhookAlert(alert: any) {
    if (!this.alertConfig.webhookUrl) return;

    await firstValueFrom(
      this.httpService.post(this.alertConfig.webhookUrl, {
        level: alert.level,
        type: alert.type,
        message: alert.message,
        value: alert.value,
        threshold: alert.threshold,
        timestamp: new Date().toISOString(),
        service: 'CRM Backend',
      }),
    );
  }

  private async sendSlackAlert(alert: any) {
    if (!this.alertConfig.slackWebhook) return;

    const color = alert.level === 'CRITICAL' ? '#ff0000' : '#ffaa00';

    await firstValueFrom(
      this.httpService.post(this.alertConfig.slackWebhook, {
        attachments: [
          {
            color,
            title: `${alert.level}: ${alert.type} Alert`,
            text: alert.message,
            fields: [
              { title: 'Value', value: alert.value?.toString() || 'N/A', short: true },
              { title: 'Threshold', value: alert.threshold?.toString() || 'N/A', short: true },
              { title: 'Service', value: 'CRM Backend', short: true },
              { title: 'Timestamp', value: new Date().toISOString(), short: true },
            ],
          },
        ],
      }),
    );
  }

  // 记录请求
  recordRequest(isError: boolean, responseTime: number) {
    this.totalRequests++;
    if (isError) {
      this.errorCount++;
    }

    this.responseTimes.push(responseTime);

    // 保持响应时间数组大小
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // 定期重置计数器
    if (this.totalRequests % 1000 === 0) {
      this.errorCount = 0;
      this.totalRequests = 0;
      this.responseTimes = [];
    }
  }

  // 获取当前指标
  getCurrentMetrics(): MetricData {
    return this.metricsHistory[this.metricsHistory.length - 1] || {
      timestamp: new Date(),
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: 0,
      activeConnections: 0,
      errorRate: 0,
      responseTime: 0,
    };
  }

  // 获取历史指标
  getMetricsHistory(minutes: number = 60): MetricData[] {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp >= cutoffTime);
  }

  // 获取系统信息
  getSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
    };
  }

  // 更新告警配置
  updateAlertConfig(config: Partial<AlertConfig>) {
    this.alertConfig = { ...this.alertConfig, ...config };
    this.logger.log('告警配置已更新', this.alertConfig);
  }

  // 更新告警阈值
  updateThresholds(thresholds: Partial<AlertThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds };
    this.logger.log('告警阈值已更新', this.thresholds);
  }
}
