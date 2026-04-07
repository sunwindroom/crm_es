import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('follow_ups')
export class FollowUp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // 通用对象类型和ID
  @Column({ name: 'object_type' })
  objectType: string;

  @Column({ name: 'object_id' })
  objectId: string;

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

  @Column({
    type: 'varchar',
    length: 50,
    default: 'call',
  })
  type: string;

  // 跟进结果
  @Column({ type: 'text', nullable: true })
  outcome: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
