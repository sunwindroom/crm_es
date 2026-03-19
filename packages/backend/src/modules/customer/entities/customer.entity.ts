import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum CustomerLevel { VIP = 'vip', IMPORTANT = 'important', NORMAL = 'normal', POTENTIAL = 'potential' }
export enum CustomerStatus { ACTIVE = 'active', INACTIVE = 'inactive', BLACKLIST = 'blacklist' }

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) name: string;
  @Column({ nullable: true }) type: string;
  @Column({ nullable: true }) industry: string;
  @Column({ nullable: true }) scale: string;
  @Column({ type: 'text', nullable: true }) address: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) website: string;
  @Column({ type: 'enum', enum: CustomerLevel, default: CustomerLevel.NORMAL }) level: CustomerLevel;
  @Column({ type: 'enum', enum: CustomerStatus, default: CustomerStatus.ACTIVE }) status: CustomerStatus;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ name: 'custom_fields', type: 'jsonb', nullable: true }) customFields: Record<string, any>;
  @Column({ name: 'owner_id', nullable: true }) ownerId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'owner_id' }) owner: User;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
