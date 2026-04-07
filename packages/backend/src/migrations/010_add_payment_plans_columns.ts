import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPaymentPlansMissingColumns1711846800000 implements MigrationInterface {
  name = 'AddPaymentPlansMissingColumns1711846800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 payment_node_id 字段
    const hasPaymentNodeId = await queryRunner.hasColumn('payment_plans', 'payment_node_id');
    if (!hasPaymentNodeId) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'payment_node_id',
        type: 'uuid',
        isNullable: true,
      }));
      console.log('Added column payment_node_id to payment_plans');
    }

    // 添加 actual_amount 字段
    const hasActualAmount = await queryRunner.hasColumn('payment_plans', 'actual_amount');
    if (!hasActualAmount) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'actual_amount',
        type: 'decimal',
        precision: 15,
        scale: 2,
        isNullable: true,
      }));
      console.log('Added column actual_amount to payment_plans');
    }

    // 添加 account_info 字段
    const hasAccountInfo = await queryRunner.hasColumn('payment_plans', 'account_info');
    if (!hasAccountInfo) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'account_info',
        type: 'text',
        isNullable: true,
      }));
      console.log('Added column account_info to payment_plans');
    }

    // 添加 confirmed_by 字段
    const hasConfirmedBy = await queryRunner.hasColumn('payment_plans', 'confirmed_by');
    if (!hasConfirmedBy) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'confirmed_by',
        type: 'uuid',
        isNullable: true,
      }));
      console.log('Added column confirmed_by to payment_plans');
    }

    // 添加 created_by 字段
    const hasCreatedBy = await queryRunner.hasColumn('payment_plans', 'created_by');
    if (!hasCreatedBy) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'created_by',
        type: 'uuid',
        isNullable: true,
      }));
      console.log('Added column created_by to payment_plans');
    }

    // 添加 remark 字段
    const hasRemark = await queryRunner.hasColumn('payment_plans', 'remark');
    if (!hasRemark) {
      await queryRunner.addColumn('payment_plans', new TableColumn({
        name: 'remark',
        type: 'text',
        isNullable: true,
      }));
      console.log('Added column remark to payment_plans');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('payment_plans', 'remark');
    await queryRunner.dropColumn('payment_plans', 'created_by');
    await queryRunner.dropColumn('payment_plans', 'confirmed_by');
    await queryRunner.dropColumn('payment_plans', 'account_info');
    await queryRunner.dropColumn('payment_plans', 'actual_amount');
    await queryRunner.dropColumn('payment_plans', 'payment_node_id');
  }
}
