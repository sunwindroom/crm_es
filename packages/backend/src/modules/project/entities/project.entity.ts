import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';
import { Milestone } from './milestone.entity';

export enum ProjectType {
  PRESALES = 'presales', DEVELOPMENT = 'development', IMPLEMENTATION = 'implementation',
  MAINTENANCE = 'maintenance', CONSULTING = 'consulting',
}
export enum ProjectStatus {
  PLANNING = 'planning', IN_PROGRESS = 'in_progress', ON_HOLD = 'on_hold',
  COMPLETED = 'completed', CANCELLED = 'cancelled',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'customer_id' }) customerId: string;
  @ManyToOne(() => Customer) @JoinColumn({ name: 'customer_id' }) customer: Customer;
  @Column({ name: 'opportunity_id', nullable: true }) opportunityId: string;
  @Column({ name: 'contract_id', nullable: true }) contractId: string;
  @Column() name: string;
  @Column({ nullable: true }) code: string;
  @Column({ type: 'enum', enum: ProjectType }) type: ProjectType;
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING }) status: ProjectStatus;
  @Column({ nullable: true }) priority: string;
  @Column() manager: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'manager' }) managerUser: User;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) budget: number;
  @Column({ name: 'start_date', type: 'date' }) startDate: Date;
  @Column({ name: 'end_date', type: 'date' }) endDate: Date;
  @Column({ name: 'actual_end_date', type: 'date', nullable: true }) actualEndDate: Date;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'int', default: 0 }) progress: number;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @OneToMany(() => Milestone, m => m.project) milestones: Milestone[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
