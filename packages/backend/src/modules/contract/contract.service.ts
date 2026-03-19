import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';

@Injectable()
export class ContractService {
  constructor(@InjectRepository(Contract) private repo: Repository<Contract>) {}

  async create(dto: any, userId: string): Promise<Contract> {
    if (dto.customerId === '') dto.customerId = undefined;
    if (dto.opportunityId === '') dto.opportunityId = undefined;
    if (dto.projectId === '') dto.projectId = undefined;
    if (dto.ownerId === '') dto.ownerId = undefined;
    const contractNo = dto.contractNo ||
      `HT${new Date().getFullYear()}${String(Date.now()).slice(-5)}`;
    const ex = await this.repo.findOne({ where: { contractNo } });
    if (ex) throw new ConflictException('合同编号已存在');
    const entity = this.repo.create({
      ...dto, contractNo, createdBy: userId, ownerId: dto.ownerId || userId,
    });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, status, customerId, keyword } = q;
    const base: any = {};
    if (status) base.status = status;
    if (customerId) base.customerId = customerId;

    let where: any = base;
    if (keyword) {
      where = [
        { ...base, name: Like(`%${keyword}%`) },
        { ...base, contractNo: Like(`%${keyword}%`) },
      ];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ['customer', 'creator'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<Contract> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'creator', 'owner'],
    });
    if (!c) throw new NotFoundException('合同不存在');
    return c;
  }

  async update(id: string, dto: any): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('只有草稿状态可修改');
    Object.assign(c, dto);
    await this.repo.save(c);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('只有草稿状态可删除');
    await this.repo.remove(c);
  }

  async submitForApproval(id: string): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('状态不符');
    c.status = ContractStatus.PENDING;
    await this.repo.save(c);
    return this.findOne(id);
  }

  async approve(id: string, userId: string): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.PENDING) throw new BadRequestException('状态不符');
    c.status = ContractStatus.APPROVED;
    c.approvedBy = userId;
    c.approvedAt = new Date();
    await this.repo.save(c);
    return this.findOne(id);
  }

  async reject(id: string): Promise<Contract> {
    const c = await this.findOne(id);
    c.status = ContractStatus.DRAFT;
    await this.repo.save(c);
    return this.findOne(id);
  }

  async sign(id: string, signDate?: Date): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.APPROVED) throw new BadRequestException('状态不符');
    c.status = ContractStatus.SIGNED;
    c.signDate = signDate || new Date();
    await this.repo.save(c);
    return this.findOne(id);
  }

  async getExpiringContracts(days = 30): Promise<Contract[]> {
    const target = new Date();
    target.setDate(target.getDate() + days);
    return this.repo.createQueryBuilder('c')
      .where('c.status = :s', { s: ContractStatus.EXECUTING })
      .andWhere('c.endDate <= :t', { t: target })
      .getMany();
  }
}
