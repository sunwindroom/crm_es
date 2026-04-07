import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum HandoverStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum HandoverType {
  LEAD = 'lead',
  CUSTOMER = 'customer',
  OPPORTUNITY = 'opportunity',
  PROJECT = 'project',
  CONTRACT = 'contract',
  PAYMENT = 'payment',
}

@Entity('handovers')
export class Handover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: HandoverType })
  type: HandoverType;

  @Column({ name: 'resource_id' })
  resourceId: string;

  @Column({ name: 'from_user_id' })
  fromUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @Column({ name: 'to_user_id' })
  toUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedUser: User;

  @Column({ type: 'enum', enum: HandoverStatus, default: HandoverStatus.PENDING })
  status: HandoverStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
