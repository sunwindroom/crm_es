import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum LeadStatus {
  NEW = 'new', CONTACTED = 'contacted', QUALIFIED = 'qualified',
  CONVERTED = 'converted', LOST = 'lost',
}
export enum LeadSource {
  WEBSITE = 'website', REFERRAL = 'referral', ADVERTISEMENT = 'advertisement',
  EXHIBITION = 'exhibition', COLD_CALL = 'cold_call', OTHER = 'other',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() company: string;
  @Column() phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ type: 'enum', enum: LeadSource, default: LeadSource.OTHER }) source: LeadSource;
  @Column({ nullable: true }) industry: string;
  @Column({ nullable: true }) region: string;
  @Column({ type: 'text', nullable: true }) requirement: string;
  @Column({ type: 'decimal', nullable: true }) budget: number;
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW }) status: LeadStatus;
  @Column({ name: 'owner_id', nullable: true }) ownerId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'owner_id' }) ownerUser: User;
  @Column({ name: 'assigned_to', nullable: true }) assignedTo: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'assigned_to' }) assignedUser: User;
  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true }) assignedAt: Date;
  @Column({ name: 'lost_reason', type: 'text', nullable: true }) lostReason: string;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @Column({ nullable: true }) department: string;
  @Column({ type: 'text', nullable: true }) remark: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
