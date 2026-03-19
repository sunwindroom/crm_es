import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'customer_id' }) customerId: string;
  @ManyToOne(() => Customer) @JoinColumn({ name: 'customer_id' }) customer: Customer;
  @Column() name: string;
  @Column({ nullable: true }) position: string;
  @Column({ nullable: true }) phone: string;
  @Column({ nullable: true }) email: string;
  @Column({ nullable: true }) department: string;
  @Column({ nullable: true }) wechat: string;
  @Column({ name: 'is_primary', default: false }) isPrimary: boolean;
  @Column({ type: 'text', nullable: true }) remark: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
