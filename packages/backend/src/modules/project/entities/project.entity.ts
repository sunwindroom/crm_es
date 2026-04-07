import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';
import { Milestone } from './milestone.entity';
import { Contract } from '../../contract/entities/contract.entity';

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
  @ManyToOne(() => Contract) @JoinColumn({ name: 'contract_id' }) contract: Contract;
  @Column() name: string;
  @Column({ nullable: true }) code: string;
  @Column({ type: 'enum', enum: ProjectType }) type: ProjectType;
  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.PLANNING }) status: ProjectStatus;
  @Column({ default: 'normal' }) priority: string;
  @Column({ nullable: true }) manager: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'manager' }) managerUser: User;
  @Column({ name: 'cs_manager', nullable: true }) csManager: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'cs_manager' }) csManagerUser: User;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) budget: number;
  @Column({ name: 'start_date', type: 'date' }) startDate: Date;
  @Column({ name: 'end_date', type: 'date' }) endDate: Date;
  @Column({ name: 'actual_end_date', type: 'date', nullable: true }) actualEndDate: Date;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'int', default: 0 }) progress: number;
  @Column({ name: 'estimated_hours', type: 'int', nullable: true }) estimatedHours: number;
  @Column({ name: 'estimated_people', type: 'int', nullable: true }) estimatedPeople: number;
  @Column({ name: 'workload_evaluation', type: 'text', nullable: true }) workloadEvaluation: string;
  @Column({ name: 'evaluation_date', type: 'date', nullable: true }) evaluationDate: Date;
  @Column({ name: 'evaluated_by', nullable: true }) evaluatedBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'evaluated_by' }) evaluator: User;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @OneToMany(() => Milestone, m => m.project) milestones: Milestone[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
