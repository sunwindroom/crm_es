import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contract } from './contract.entity';

@Entity('payment_nodes')
export class PaymentNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'contract_id' })
  contractId: string;

  @ManyToOne(() => Contract)
  @JoinColumn({ name: 'contract_id' })
  contract: Contract;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ name: 'planned_date', type: 'date' })
  plannedDate: Date;

  @Column({ name: 'actual_date', type: 'date', nullable: true })
  actualDate: Date;

  @Column({ name: 'actual_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  actualAmount: number;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'overdue'], default: 'pending' })
  status: 'pending' | 'paid' | 'overdue';

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
