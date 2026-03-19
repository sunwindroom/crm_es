import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from '../../contract/entities/contract.entity';

export enum PaymentStatus {
  PENDING = 'pending', PARTIAL = 'partial', COMPLETED = 'completed',
  OVERDUE = 'overdue', CANCELLED = 'cancelled',
}

@Entity('payment_plans')
export class PaymentPlan {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'contract_id' }) contractId: string;
  @ManyToOne(() => Contract) @JoinColumn({ name: 'contract_id' }) contract: Contract;
  @Column({ name: 'plan_no', nullable: true }) planNo: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;
  @Column({ name: 'planned_date', type: 'date' }) plannedDate: Date;
  @Column({ name: 'actual_date', type: 'date', nullable: true }) actualDate: Date;
  @Column({ name: 'payment_method', nullable: true }) paymentMethod: string;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Column({ type: 'text', nullable: true }) description: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
