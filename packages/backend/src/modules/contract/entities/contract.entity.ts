import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';

export enum ContractStatus {
  DRAFT = 'draft', PENDING = 'pending', APPROVED = 'approved',
  SIGNED = 'signed', EXECUTING = 'executing', COMPLETED = 'completed', TERMINATED = 'terminated',
}

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'customer_id' }) customerId: string;
  @ManyToOne(() => Customer) @JoinColumn({ name: 'customer_id' }) customer: Customer;
  @Column({ name: 'opportunity_id', nullable: true }) opportunityId: string;
  @Column({ name: 'project_id', nullable: true }) projectId: string;
  @Column({ name: 'contract_no', unique: true }) contractNo: string;
  @Column() name: string;
  @Column({ nullable: true }) type: string;
  @Column({ type: 'decimal', precision: 15, scale: 2 }) amount: number;
  @Column({ name: 'paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }) paidAmount: number;
  @Column({ name: 'sign_date', type: 'date', nullable: true }) signDate: Date;
  @Column({ name: 'start_date', type: 'date' }) startDate: Date;
  @Column({ name: 'end_date', type: 'date' }) endDate: Date;
  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT }) status: ContractStatus;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'text', nullable: true }) terms: string;
  @Column({ name: 'created_by' }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @Column({ name: 'owner_id', nullable: true }) ownerId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'owner_id' }) owner: User;
  @Column({ name: 'approved_by', nullable: true }) approvedBy: string;
  @Column({ name: 'approved_at', type: 'timestamp', nullable: true }) approvedAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
