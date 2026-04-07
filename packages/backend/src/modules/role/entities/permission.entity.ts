import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({ length: 50 })
  resource: string;

  @Column({
    type: 'enum',
    enum: ['view', 'create', 'edit', 'delete', 'assign', 'approve'],
  })
  action: 'view' | 'create' | 'edit' | 'delete' | 'assign' | 'approve';

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 多对多关系：权限属于多个角色
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
