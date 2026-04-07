import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Opportunity } from './opportunity.entity';
import { User } from '../../user/entities/user.entity';

@Entity('opportunity_follow_ups')
export class OpportunityFollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'opportunity_id' })
  opportunityId: string;

  @ManyToOne(() => Opportunity)
  @JoinColumn({ name: 'opportunity_id' })
  opportunity: Opportunity;

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
