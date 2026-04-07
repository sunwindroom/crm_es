import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';
import { User } from '../../user/entities/user.entity';

@Entity('project_members')
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id' })
  projectId: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ['manager', 'member'], default: 'member' })
  role: 'manager' | 'member';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
