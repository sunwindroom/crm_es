import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../user/entities/user.entity';

export enum MilestoneStatus {
  NOT_STARTED = 'not_started', IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed', DELAYED = 'delayed', CANCELLED = 'cancelled',
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'project_id' }) projectId: string;
  @ManyToOne(() => Project, p => p.milestones) @JoinColumn({ name: 'project_id' }) project: Project;
  @Column() name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ name: 'planned_date', type: 'date' }) plannedDate: Date;
  @Column({ name: 'actual_date', type: 'date', nullable: true }) actualDate: Date;
  @Column({ type: 'enum', enum: MilestoneStatus, default: MilestoneStatus.NOT_STARTED }) status: MilestoneStatus;
  @Column({ nullable: true }) assignee: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'assignee' }) assigneeUser: User;
  @Column({ type: 'simple-array', nullable: true }) dependencies: string[];
  @Column({ name: 'delay_reason', type: 'text', nullable: true }) delayReason: string;
  @Column({ type: 'int', default: 1 }) weight: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
