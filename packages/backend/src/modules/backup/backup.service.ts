import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = './backups';
  private readonly retentionDays = 7;

  constructor() {
    this.initializeBackupDirs();
  }

  private initializeBackupDirs() {
    const dirs = [
      path.join(this.backupDir, 'full'),
      path.join(this.backupDir, 'incremental'),
      path.join(this.backupDir, 'logs'),
    ];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledFullBackup() {
    this.logger.log('开始定时完整备份...');
    try {
      await this.performFullBackup();
      this.logger.log('定时完整备份完成');
    } catch (error) {
      this.logger.error('定时完整备份失败', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduledIncrementalBackup() {
    this.logger.log('开始定时增量备份...');
    try {
      await this.performIncrementalBackup();
      this.logger.log('定时增量备份完成');
    } catch (error) {
      this.logger.error('定时增量备份失败', error);
    }
  }

  async performFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      this.backupDir,
      'full',
      `crm_full_${timestamp}.sql`,
    );

    this.logger.log(`开始完整备份: ${backupFile}`);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'crm_db';
    const dbUser = process.env.DB_USER || 'postgres';

    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F c -b -v -f ${backupFile} ${dbName}`;

    try {
      await execAsync(command);

      // 压缩备份文件
      await execAsync(`gzip ${backupFile}`);
      const compressedFile = `${backupFile}.gz`;

      // 获取文件大小
      const stats = fs.statSync(compressedFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      this.logger.log(`完整备份完成: ${compressedFile} (${sizeMB} MB)`);

      // 记录备份历史
      this.recordBackupHistory('full', compressedFile, sizeMB);

      return compressedFile;
    } catch (error) {
      this.logger.error('完整备份失败', error);
      throw error;
    }
  }

  async performIncrementalBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(
      this.backupDir,
      'incremental',
      `crm_incremental_${timestamp}.sql`,
    );

    this.logger.log(`开始增量备份: ${backupFile}`);

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'crm_db';
    const dbUser = process.env.DB_USER || 'postgres';

    // 增量备份使用pg_dump的特定选项
    const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F c -b -v -f ${backupFile} ${dbName}`;

    try {
      await execAsync(command);

      // 压缩备份文件
      await execAsync(`gzip ${backupFile}`);
      const compressedFile = `${backupFile}.gz`;

      // 获取文件大小
      const stats = fs.statSync(compressedFile);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      this.logger.log(`增量备份完成: ${compressedFile} (${sizeMB} MB)`);

      // 记录备份历史
      this.recordBackupHistory('incremental', compressedFile, sizeMB);

      return compressedFile;
    } catch (error) {
      this.logger.error('增量备份失败', error);
      throw error;
    }
  }

  private recordBackupHistory(type: string, file: string, size: string) {
    const historyFile = path.join(this.backupDir, 'logs', 'backup_history.log');
    const timestamp = new Date().toISOString();
    const entry = `${timestamp},${type},${file},${size} MB\n`;

    fs.appendFileSync(historyFile, entry);
  }

  async cleanupOldBackups(): Promise<void> {
    this.logger.log('开始清理过期备份...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const dirs = [
      path.join(this.backupDir, 'full'),
      path.join(this.backupDir, 'incremental'),
    ];

    let deletedCount = 0;

    for (const dir of dirs) {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          this.logger.debug(`删除过期备份: ${filePath}`);
        }
      }
    }

    this.logger.log(`清理完成,删除了 ${deletedCount} 个过期备份文件`);
  }

  async listBackups(): Promise<{
    full: Array<{ file: string; size: string; date: Date }>;
    incremental: Array<{ file: string; size: string; date: Date }>;
  }> {
    const result = {
      full: this.getBackupFiles(path.join(this.backupDir, 'full')),
      incremental: this.getBackupFiles(path.join(this.backupDir, 'incremental')),
    };

    return result;
  }

  private getBackupFiles(dir: string): Array<{
    file: string;
    size: string;
    date: Date;
  }> {
    if (!fs.existsSync(dir)) {
      return [];
    }

    const files = fs.readdirSync(dir);

    return files
      .filter((file) => file.endsWith('.sql.gz'))
      .map((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        return {
          file: filePath,
          size: `${sizeMB} MB`,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async verifyBackup(backupFile: string): Promise<boolean> {
    this.logger.log(`验证备份文件: ${backupFile}`);

    if (!fs.existsSync(backupFile)) {
      this.logger.error('备份文件不存在');
      return false;
    }

    try {
      // 检查文件是否可以解压
      await execAsync(`gzip -t ${backupFile}`);
      this.logger.log('备份文件验证通过');
      return true;
    } catch (error) {
      this.logger.error('备份文件验证失败', error);
      return false;
    }
  }

  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: string;
    oldestBackup: Date | null;
    newestBackup: Date | null;
  }> {
    const backups = await this.listBackups();
    const allBackups = [...backups.full, ...backups.incremental];

    let totalSize = 0;
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    for (const backup of allBackups) {
      const stats = fs.statSync(backup.file);
      totalSize += stats.size;

      if (!oldestDate || stats.mtime < oldestDate) {
        oldestDate = stats.mtime;
      }

      if (!newestDate || stats.mtime > newestDate) {
        newestDate = stats.mtime;
      }
    }

    return {
      totalBackups: allBackups.length,
      totalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
      oldestBackup: oldestDate,
      newestBackup: newestDate,
    };
  }
}
