import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerServiceManager1711934400000 implements MigrationInterface {
  name = 'AddCustomerServiceManager1711934400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 扩展用户角色枚举，新增customer_service_manager角色
    await queryRunner.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM(
        'admin', 'ceo', 'cto', 'cmo', 'sales_manager', 'sales',
        'project_manager', 'business', 'finance', 'engineer',
        'customer_service_manager'
      ) NOT NULL DEFAULT 'sales'
    `);
    console.log('Added customer_service_manager role to users table');

    // 2. 项目表新增cs_manager字段
    await queryRunner.query(`
      ALTER TABLE projects ADD COLUMN cs_manager VARCHAR(36) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE projects ADD CONSTRAINT fk_projects_cs_manager
      FOREIGN KEY (cs_manager) REFERENCES users(id) ON DELETE SET NULL
    `);
    console.log('Added cs_manager column to projects table');

    // 3. 创建notifications表
    await queryRunner.query(`
      CREATE TABLE notifications (
        id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        type ENUM('lead_handover', 'project_assigned', 'cs_manager_assigned', 'pm_assigned') NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        resource_type VARCHAR(50) NULL,
        resource_id VARCHAR(36) NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created notifications table');

    // 4. 创建索引
    await queryRunner.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_is_read ON notifications(is_read)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_notifications_created_at ON notifications(created_at)
    `);
    console.log('Created indexes for notifications table');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚：删除索引
    await queryRunner.query(`DROP INDEX idx_notifications_created_at ON notifications`);
    await queryRunner.query(`DROP INDEX idx_notifications_is_read ON notifications`);
    await queryRunner.query(`DROP INDEX idx_notifications_user_id ON notifications`);
    console.log('Dropped indexes for notifications table');

    // 回滚：删除notifications表
    await queryRunner.query(`DROP TABLE notifications`);
    console.log('Dropped notifications table');

    // 回滚：删除projects表的cs_manager字段
    await queryRunner.query(`ALTER TABLE projects DROP FOREIGN KEY fk_projects_cs_manager`);
    await queryRunner.query(`ALTER TABLE projects DROP COLUMN cs_manager`);
    console.log('Removed cs_manager column from projects table');

    // 回滚：移除customer_service_manager角色
    await queryRunner.query(`UPDATE users SET role = 'sales' WHERE role = 'customer_service_manager'`);
    await queryRunner.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM(
        'admin', 'ceo', 'cto', 'cmo', 'sales_manager', 'sales',
        'project_manager', 'business', 'finance', 'engineer'
      ) NOT NULL DEFAULT 'sales'
    `);
    console.log('Removed customer_service_manager role from users table');
  }
}
