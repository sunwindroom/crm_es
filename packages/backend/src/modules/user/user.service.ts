import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(dto: any): Promise<User> {
    await this.checkUnique(dto);
    const hashed = await bcrypt.hash(dto.password, 10);
    const entity = this.repo.create({ ...dto, password: hashed });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { keyword, role, status, page = 1, pageSize = 10 } = q;
    const base: any = {};
    if (role) base.role = role;
    if (status) base.status = status;

    let where: any = base;
    if (keyword) {
      where = [
        { ...base, name: Like(`%${keyword}%`) },
        { ...base, username: Like(`%${keyword}%`) },
        { ...base, phone: Like(`%${keyword}%`) },
      ];
    }

    const total = await this.repo.count({ where });
    if (total === 0) return { users: [], total: 0 };

    const users = await this.repo.find({
      where,
      select: ['id','username','name','phone','email','department','position',
               'avatar','role','status','superiorId','createdAt','updatedAt'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const supIds = [...new Set(users.map(u => u.superiorId).filter(Boolean))] as string[];
    const sups = supIds.length
      ? await this.repo.find({ where: { id: In(supIds) }, select: ['id','name'] })
      : [];
    const supMap = new Map(sups.map(s => [s.id, s.name]));

    return {
      users: users.map(u => ({
        ...u,
        superiorName: u.superiorId ? supMap.get(u.superiorId) : undefined,
      })),
      total,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (user.superiorId) {
      const sup = await this.repo.findOne({
        where: { id: user.superiorId }, select: ['id','name'],
      });
      (user as any).superiorName = sup?.name;
    }
    return user;
  }

  async update(id: string, dto: any): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    if (dto.username && dto.username !== user.username) {
      if (await this.repo.findOne({ where: { username: dto.username } }))
        throw new ConflictException('用户名已存在');
    }
    if (dto.phone && dto.phone !== user.phone) {
      if (await this.repo.findOne({ where: { phone: dto.phone } }))
        throw new ConflictException('手机号已被注册');
    }
    if (dto.email && dto.email !== user.email) {
      if (await this.repo.findOne({ where: { email: dto.email } }))
        throw new ConflictException('邮箱已被注册');
    }
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    Object.assign(user, dto);
    await this.repo.save(user);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    await this.repo.remove(user);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.password = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    user.status = status;
    await this.repo.save(user);
    return this.findOne(id);
  }

  async getSalesUsers(keyword?: string): Promise<User[]> {
    const where: any[] = keyword
      ? [
          { name: Like(`%${keyword}%`), status: UserStatus.ACTIVE },
          { username: Like(`%${keyword}%`), status: UserStatus.ACTIVE },
        ]
      : [{ status: UserStatus.ACTIVE }];

    return this.repo.find({
      where,
      select: ['id','username','name','phone','email','department','position','role'],
    });
  }

  async getSubordinates(superiorId: string): Promise<User[]> {
    return this.repo.find({
      where: { superiorId },
      select: ['id','username','name','phone','email','department','position','role','status'],
    });
  }

  async getSuperior(userId: string): Promise<User | null> {
    const user = await this.repo.findOne({ where: { id: userId }, select: ['superiorId'] });
    if (!user?.superiorId) return null;
    return this.repo.findOne({ where: { id: user.superiorId } });
  }

  private async checkUnique(dto: any) {
    if (dto.username && await this.repo.findOne({ where: { username: dto.username } }))
      throw new ConflictException('用户名已存在');
    if (dto.phone && await this.repo.findOne({ where: { phone: dto.phone } }))
      throw new ConflictException('手机号已被注册');
    if (dto.email && await this.repo.findOne({ where: { email: dto.email } }))
      throw new ConflictException('邮箱已被注册');
  }
}
