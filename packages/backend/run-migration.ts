import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// 数据库配置
const pool = new Pool({
  host: '192.168.10.19',
  port: 5432,
  user: 'crm_user',
  password: 'crm_password_2025',
  database: 'crm_db',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('开始执行迁移...');
    
    // 读取迁移脚本
    const migrationFile = path.join(__dirname, '../scripts/migrations/009_create_lead_follow_ups_table.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // 执行迁移
    await client.query(sql);
    
    console.log('迁移执行成功！');
    
    // 验证表是否存在
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'lead_follow_ups'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ 表 lead_follow_ups 已成功创建');
    } else {
      console.log('❌ 表 lead_follow_ups 创建失败');
    }
    
  } catch (error: any) {
    console.error('迁移执行失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);
