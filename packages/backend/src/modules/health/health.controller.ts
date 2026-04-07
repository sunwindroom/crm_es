import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { Lead } from '../lead/entities/lead.entity';
import { Customer } from '../customer/entities/customer.entity';

interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: 'ok' | 'error'; message: string; latency?: number };
    memory: { status: 'ok' | 'error' | 'warning'; message: string; usage?: any };
    cpu: { status: 'ok' | 'error' | 'warning'; message: string; usage?: any };
  };
  metrics: {
    totalUsers: number;
    totalLeads: number;
    totalCustomers: number;
    activeConnections: number;
  };
}

@Controller('health')
export class HealthController {
  private startTime = Date.now();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      memory: this.checkMemory(),
      cpu: this.checkCpu(),
    };

    // 确定整体状态
    let status: 'ok' | 'error' | 'degraded' = 'ok';
    if (checks.database.status === 'error') {
      status = 'error';
    } else if (checks.memory.status === 'error' || checks.cpu.status === 'error') {
      status = 'error';
    } else if (checks.memory.status === 'warning' || checks.cpu.status === 'warning') {
      status = 'degraded';
    }

    // 获取业务指标
    const metrics = await this.getMetrics();

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.APP_ENV || 'development',
      checks,
      metrics,
    };
  }

  @Public()
  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  async readiness() {
    const dbCheck = await this.checkDatabase();
    if (dbCheck.status === 'error') {
      return { status: 'not_ready', reason: 'database_unavailable', timestamp: new Date().toISOString() };
    }
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  private async checkDatabase() {
    try {
      const start = Date.now();
      await this.userRepository.query('SELECT 1');
      const latency = Date.now() - start;

      return {
        status: 'ok' as const,
        message: 'Database connection is healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'error' as const,
        message: `Database connection failed: ${error.message}`,
      };
    }
  }

  private checkMemory() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

    let status: 'ok' | 'error' | 'warning' = 'ok';
    let message = `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB (${heapUsagePercent}%)`;

    if (heapUsagePercent > 90) {
      status = 'error';
      message = `Critical memory usage: ${heapUsagePercent}%`;
    } else if (heapUsagePercent > 75) {
      status = 'warning';
      message = `High memory usage: ${heapUsagePercent}%`;
    }

    return {
      status,
      message,
      usage: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        heapUsagePercent,
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    };
  }

  private checkCpu() {
    const cpuUsage = process.cpuUsage();
    const totalUsage = cpuUsage.user + cpuUsage.system;
    const userPercent = Math.round((cpuUsage.user / totalUsage) * 100);
    const systemPercent = Math.round((cpuUsage.system / totalUsage) * 100);
    const totalPercent = userPercent + systemPercent;

    let status: 'ok' | 'error' | 'warning' = 'ok';
    let message = `CPU usage: User ${userPercent}%, System ${systemPercent}%`;

    if (totalPercent > 95) {
      status = 'error';
      message = `Critical CPU usage: ${totalPercent}%`;
    } else if (totalPercent > 90) {
      status = 'warning';
      message = `High CPU usage: ${totalPercent}%`;
    }

    return {
      status,
      message,
      usage: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        userPercent,
        systemPercent,
      },
    };
  }

  private async getMetrics() {
    try {
      const [totalUsers, totalLeads, totalCustomers] = await Promise.all([
        this.userRepository.count(),
        this.leadRepository.count(),
        this.customerRepository.count(),
      ]);

      return {
        totalUsers,
        totalLeads,
        totalCustomers,
        activeConnections: 1, // 简化版本，实际应该从连接池获取
      };
    } catch (error) {
      return {
        totalUsers: 0,
        totalLeads: 0,
        totalCustomers: 0,
        activeConnections: 0,
      };
    }
  }
}
