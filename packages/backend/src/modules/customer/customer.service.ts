import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Contact } from './entities/contact.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private repo: Repository<Customer>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
  ) {}

  async create(dto: any, userId: string): Promise<Customer> {
    if (dto.ownerId === '') dto.ownerId = undefined;
    if (dto.createdBy === '') dto.createdBy = undefined;
    const ex = await this.repo.findOne({ where: { name: dto.name } });
    if (ex) throw new ConflictException('客户名称已存在');
    const entity = this.repo.create({ ...dto, createdBy: userId, ownerId: dto.ownerId || userId });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, level, status, keyword } = q;
    const base: any = {};
    if (level) base.level = level;
    if (status) base.status = status;

    let where: any = base;
    if (keyword) {
      where = [
        { ...base, name: Like(`%${keyword}%`) },
        { ...base, phone: Like(`%${keyword}%`) },
      ];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.repo.find({
      where,
      relations: ['owner', 'creator'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<Customer> {
    const c = await this.repo.findOne({ where: { id }, relations: ['owner', 'creator'] });
    if (!c) throw new NotFoundException('客户不存在');
    return c;
  }

  async getCustomer360View(id: string) {
    const customer = await this.findOne(id);
    const contacts = await this.contactRepo.find({ where: { customerId: id } });
    return { customer, contacts };
  }

  async update(id: string, dto: any): Promise<Customer> {
    const c = await this.findOne(id);
    if (dto.name && dto.name !== c.name) {
      const ex = await this.repo.findOne({ where: { name: dto.name } });
      if (ex) throw new ConflictException('客户名称已存在');
    }
    Object.assign(c, dto);
    await this.repo.save(c);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const c = await this.findOne(id);
    await this.repo.remove(c);
  }

  async addContact(customerId: string, data: any): Promise<Contact> {
    await this.findOne(customerId);
    const entity = this.contactRepo.create({ ...data, customerId });
    return (await this.contactRepo.save(entity)) as unknown as Contact;
  }

  async getContacts(customerId: string): Promise<Contact[]> {
    return this.contactRepo.find({
      where: { customerId },
      order: { isPrimary: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateContact(cid: string, data: any): Promise<Contact> {
    const c = await this.contactRepo.findOne({ where: { id: cid } });
    if (!c) throw new NotFoundException('联系人不存在');
    Object.assign(c, data);
    return (await this.contactRepo.save(c)) as unknown as Contact;
  }

  async removeContact(cid: string): Promise<void> {
    const c = await this.contactRepo.findOne({ where: { id: cid } });
    if (!c) throw new NotFoundException('联系人不存在');
    await this.contactRepo.remove(c);
  }
}
