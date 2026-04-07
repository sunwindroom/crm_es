import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * 审计日志操作类型
 */
export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN = 'assign',
  CONVERT = 'convert',
  HANDOVER = 'handover',
  LOGIN = 'login',
  LOGOUT = 'logout',
  PERMISSION_DENIED = 'permission_denied',
}

/**
 * 审计日志资源类型
 */
export enum AuditResource {
  USER = 'user',
  LEAD = 'lead',
  CUSTOMER = 'customer',
  OPPORTUNITY = 'opportunity',
  PROJECT = 'project',
  CONTRACT = 'contract',
  PAYMENT = 'payment',
  PAYMENT_NODE = 'payment_node',
  HANDOVER = 'handover',
  PERMISSION = 'permission',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['resource'])
@Index(['resourceId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: AuditResource,
  })
  resource: AuditResource;

  @Column({ type: 'uuid', name: 'resource_id' })
  resourceId: string;

  @Column({ type: 'json', name: 'old_value', nullable: true })
  oldValue: any;

  @Column({ type: 'json', name: 'new_value', nullable: true })
  newValue: any;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'varchar', length: 50 })
  ip: string;

  @Column({ type: 'text', name: 'user_agent' })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
