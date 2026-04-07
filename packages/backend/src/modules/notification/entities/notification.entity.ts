import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  LEAD_HANDOVER = 'lead_handover',
  PROJECT_ASSIGNED = 'project_assigned',
  CS_MANAGER_ASSIGNED = 'cs_manager_assigned',
  PM_ASSIGNED = 'pm_assigned',
}

@Entity('notifications')
@Index('idx_notifications_user_id', ['userId'])
@Index('idx_notifications_is_read', ['isRead'])
@Index('idx_notifications_created_at', ['createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'user_id' }) user: User;

  @Column({ type: 'enum', enum: NotificationType }) type: NotificationType;

  @Column() title: string;

  @Column({ type: 'text' }) content: string;

  @Column({ name: 'resource_type', nullable: true }) resourceType: string;

  @Column({ name: 'resource_id', nullable: true }) resourceId: string;

  @Column({ name: 'is_read', default: false }) isRead: boolean;

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
