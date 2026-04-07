import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

export enum UserStatus { ACTIVE = 'active', INACTIVE = 'inactive', LOCKED = 'locked' }
export enum UserRole {
  ADMIN = 'admin', CEO = 'ceo', CTO = 'cto', CMO = 'cmo',
  SALES_MANAGER = 'sales_manager', SALES = 'sales',
  PROJECT_MANAGER = 'project_manager', BUSINESS = 'business', FINANCE = 'finance',
  ENGINEER = 'engineer',
  CUSTOMER_SERVICE_MANAGER = 'customer_service_manager',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) username: string;
  @Column() @Exclude() password: string;
  @Column() name: string;
  @Column({ unique: true }) phone: string;
  @Column({ unique: true, nullable: true }) email: string;
  @Column({ nullable: true }) department: string;
  @Column({ nullable: true }) position: string;
  @Column({ nullable: true }) avatar: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.SALES }) role: UserRole;
  @Column({ name: 'superior_id', nullable: true }) superiorId: string;
  @Expose() superiorName?: string;
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE }) status: UserStatus;
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true }) lastLoginAt: Date;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
