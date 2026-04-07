import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Customer } from './customer.entity';
import { User } from '../../user/entities/user.entity';

export enum VisitType {
  ONSITE = 'onsite',        // 现场拜访
  PHONE = 'phone',          // 电话沟通
  VIDEO = 'video',          // 视频会议
  EMAIL = 'email',          // 邮件沟通
  OTHER = 'other',          // 其他
}

@Entity('customer_visits')
export class CustomerVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ type: 'enum', enum: VisitType, default: VisitType.ONSITE })
  type: VisitType;

  @Column({ name: 'visit_date', type: 'date' })
  visitDate: Date;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'next_action', type: 'text', nullable: true })
  nextAction: string;

  @Column({ name: 'next_action_date', type: 'date', nullable: true })
  nextActionDate: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
