import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEngineerRoleData1711933200001 implements MigrationInterface {
  name = 'AddEngineerRoleData1711933200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 插入工程师角色
    await queryRunner.query(`
      INSERT INTO roles (name, code, description, is_system) 
      VALUES ('工程师', 'engineer', '工程师，参与项目实施并填报工时', false)
      ON CONFLICT (code) DO NOTHING
    `);

    // 为工程师角色分配权限
    // 工程师可以查看项目、查看和创建工时记录
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id 
      FROM roles r, permissions p 
      WHERE r.code = 'engineer'
      AND p.code IN (
          'project:view',
          'lead:view',
          'customer:view',
          'opportunity:view',
          'contract:view',
          'payment:view'
      )
      ON CONFLICT DO NOTHING
    `);

    console.log('Added engineer role and permissions');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除工程师角色的权限关联
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE role_id IN (SELECT id FROM roles WHERE code = 'engineer')
    `);

    // 删除工程师角色
    await queryRunner.query(`
      DELETE FROM roles WHERE code = 'engineer'
    `);

    console.log('Removed engineer role and permissions');
  }
}
