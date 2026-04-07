import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEngineerRole1711933200000 implements MigrationInterface {
  name = 'AddEngineerRole1711933200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 扩展用户角色枚举，新增engineer角色
    // MySQL需要使用ALTER TABLE修改枚举类型
    await queryRunner.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM(
        'admin', 'ceo', 'cto', 'cmo', 'sales_manager', 'sales',
        'project_manager', 'business', 'finance', 'engineer'
      ) NOT NULL DEFAULT 'sales'
    `);
    console.log('Added engineer role to users table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：移除engineer角色
    // 注意：需要先处理role为engineer的用户，否则会失败
    await queryRunner.query(`
      UPDATE users SET role = 'sales' WHERE role = 'engineer'
    `);
    
    await queryRunner.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM(
        'admin', 'ceo', 'cto', 'cmo', 'sales_manager', 'sales',
        'project_manager', 'business', 'finance'
      ) NOT NULL DEFAULT 'sales'
    `);
    console.log('Removed engineer role from users table');
  }
}
