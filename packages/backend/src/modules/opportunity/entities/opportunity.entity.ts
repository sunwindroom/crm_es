import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';

export enum OpportunityStage {
  INITIAL = 'initial', REQUIREMENT = 'requirement', PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation', CONTRACT = 'contract',
}
export enum OpportunityStatus { ACTIVE = 'active', WON = 'won', LOST = 'lost' }

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'customer_id' }) customerId: string;
  @ManyToOne(() => Customer) @JoinColumn({ name: 'customer_id' }) customer: Customer;
  @Column({ name: 'lead_id', nullable: true }) leadId: string;
  @Column() name: string;
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 }) amount: number;
  @Column({ type: 'enum', enum: OpportunityStage, default: OpportunityStage.INITIAL }) stage: OpportunityStage;
  @Column({ type: 'int', default: 20 }) probability: number;
  @Column({ name: 'expected_close_date', type: 'date', nullable: true }) expectedCloseDate: Date;
  @Column({ type: 'enum', enum: OpportunityStatus, default: OpportunityStatus.ACTIVE }) status: OpportunityStatus;
  @Column({ name: 'lost_reason', type: 'text', nullable: true }) lostReason: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ name: 'owner_id', nullable: true }) ownerId: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'owner_id' }) owner: User;
  @Column({ name: 'created_by', nullable: true }) createdBy: string;
  @ManyToOne(() => User) @JoinColumn({ name: 'created_by' }) creator: User;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
