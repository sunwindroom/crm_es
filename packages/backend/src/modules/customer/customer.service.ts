import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { Contact } from './entities/contact.entity';
import { CustomerVisit } from './entities/customer-visit.entity';
import { FollowUp } from '../follow-up/entities/follow-up.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { User, UserRole } from '../user/entities/user.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer) private repo: Repository<Customer>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(CustomerVisit) private visitRepo: Repository<CustomerVisit>,
    @InjectRepository(FollowUp) private followUpRepo: Repository<FollowUp>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataPermissionService: DataPermissionService,
  ) {}

  async create(dto: any, userId: string): Promise<Customer> {
    // 检查创建权限
    const canCreate = await this.dataPermissionService.isSalesRole(userId);
    if (!canCreate) {
      throw new ForbiddenException('无权创建客户');
    }

    if (dto.ownerId === '') dto.ownerId = undefined;
    if (dto.createdBy === '') dto.createdBy = undefined;

    // 如果指定了负责人，检查是否有权限分配
    if (dto.ownerId && dto.ownerId !== userId) {
      const canAssign = await this.dataPermissionService.canAssignToUser(userId, dto.ownerId);
      if (!canAssign) {
        throw new ForbiddenException('无权将客户分配给指定用户');
      }
    }

    const ex = await this.repo.findOne({ where: { name: dto.name } });
    if (ex) throw new ConflictException('客户名称已存在');
    const entity = this.repo.create({ ...dto, createdBy: userId, ownerId: dto.ownerId || userId });
    const saved = (await this.repo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, level, status, keyword } = q;
    const base: any = {};
    if (level) base.level = level;
    if (status) base.status = status;

    // 添加数据权限过滤
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      // 如果返回null，表示管理员，不过滤
      if (accessibleIds !== null) {
        base.ownerId = In(accessibleIds);
      }
    }

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

  async findOne(id: string, userId?: string): Promise<Customer> {
    const c = await this.repo.findOne({ where: { id }, relations: ['owner', 'creator'] });
    if (!c) throw new NotFoundException('客户不存在');

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(c.ownerId || '')) {
        throw new ForbiddenException('无权访问该客户');
      }
    }

    return c;
  }

  async getCustomer360View(id: string) {
    const customer = await this.findOne(id);
    const contacts = await this.contactRepo.find({ where: { customerId: id } });
    return { customer, contacts };
  }

  async update(id: string, dto: any, userId: string): Promise<Customer> {
    const c = await this.findOne(id);

    // 检查权限：只有系统管理员、总裁或营销副总裁可以编辑
    const canEdit = await this.dataPermissionService.canEditAllData(userId);
    if (!canEdit) {
      throw new ForbiddenException('只有系统管理员、总裁或营销副总裁可以编辑客户');
    }

    if (dto.name && dto.name !== c.name) {
      const ex = await this.repo.findOne({ where: { name: dto.name } });
      if (ex) throw new ConflictException('客户名称已存在');
    }
    Object.assign(c, dto);
    await this.repo.save(c);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const c = await this.findOne(id);

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除客户');
    }
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

  /**
   * 分配客户给下级
   */
  async assign(customerId: string, toUserId: string, operatorUserId: string): Promise<Customer> {
    const customer = await this.repo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('客户不存在');

    const targetUser = await this.userRepo.findOne({ where: { id: toUserId } });
    if (!targetUser) throw new NotFoundException('目标用户不存在');

    // 使用统一的权限检查方法
    const canAssign = await this.dataPermissionService.canAssignToUser(operatorUserId, toUserId);
    if (!canAssign) {
      const operator = await this.userRepo.findOne({ where: { id: operatorUserId } });
      const reason = this.getAssignDeniedReason(operator?.role, targetUser.role);
      throw new ForbiddenException(reason);
    }

    customer.ownerId = toUserId;
    await this.repo.save(customer);
    return this.findOne(customerId);
  }

  /**
   * 批量分配客户
   */
  async batchAssign(customerIds: string[], toUserId: string, operatorUserId: string): Promise<void> {
    // 检查目标用户是否存在
    const targetUser = await this.userRepo.findOne({ where: { id: toUserId } });
    if (!targetUser) throw new NotFoundException('目标用户不存在');

    // 检查权限
    const currentUser = await this.userRepo.findOne({ where: { id: operatorUserId } });
    if (!currentUser) throw new ForbiddenException('用户不存在');

    // 管理员、总裁、营销副总裁可以分配给任何人
    const canAssignAnyone = [UserRole.ADMIN, UserRole.CEO, UserRole.CMO].includes(currentUser.role);

    // 其他角色只能分配给下级
    if (!canAssignAnyone && targetUser.superiorId !== operatorUserId) {
      throw new ForbiddenException('只能分配给下级用户');
    }

    await this.repo
      .createQueryBuilder()
      .update(Customer)
      .set({ ownerId: toUserId })
      .whereInIds(customerIds)
      .execute();
  }

  /**
   * 生成分配拒绝的原因说明
   */
  private getAssignDeniedReason(operatorRole?: UserRole, targetRole?: UserRole): string {
    if (!operatorRole) return '用户不存在';

    if (operatorRole === UserRole.SALES) {
      return '销售人员无权分配客户';
    }

    if (operatorRole === UserRole.SALES_MANAGER) {
      return '销售经理只能将客户分配给下属';
    }

    return '无权将客户分配给该用户';
  }

  /**
   * 添加客户拜访记录
   * 上下级都可以填写客户拜访记录
   */
  async addVisit(customerId: string, data: any, userId: string): Promise<CustomerVisit> {
    const customer = await this.findOne(customerId);

    // 检查数据权限：上下级都可以填写拜访记录
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    if (accessibleIds !== null && !accessibleIds.includes(customer.ownerId || '')) {
      // 检查是否是上级
      const superiorIds = await this.dataPermissionService.getSuperiorIds(customer.ownerId || '');
      if (!superiorIds.includes(userId)) {
        throw new ForbiddenException('无权为该客户添加拜访记录');
      }
    }

    const visit = this.visitRepo.create({
      customerId,
      type: data.type || 'onsite',
      visitDate: data.visitDate || new Date(),
      content: data.content,
      nextAction: data.nextAction,
      nextActionDate: data.nextActionDate,
      remark: data.remark,
      createdBy: userId,
    });

    return this.visitRepo.save(visit);
  }

  /**
   * 获取客户拜访记录
   * 上下级都可以查看客户拜访记录
   */
  async getVisits(customerId: string, userId?: string): Promise<CustomerVisit[]> {
    const customer = await this.findOne(customerId);

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(customer.ownerId || '')) {
        // 检查是否是上级
        const superiorIds = await this.dataPermissionService.getSuperiorIds(customer.ownerId || '');
        if (!superiorIds.includes(userId)) {
          throw new ForbiddenException('无权查看该客户的拜访记录');
        }
      }
    }

    return this.visitRepo.find({
      where: { customerId },
      relations: ['creator'],
      order: { visitDate: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * 添加客户跟进记录
   * 总裁、营销副总裁、销售经理、销售都可以添加跟进记录
   */
  async addFollowUp(customerId: string, data: any, userId: string): Promise<FollowUp> {
    const customer = await this.findOne(customerId);

    // 检查数据权限：上下级都可以添加跟进记录
    const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
    if (accessibleIds !== null && !accessibleIds.includes(customer.ownerId || '')) {
      // 检查是否是上级
      const superiorIds = await this.dataPermissionService.getSuperiorIds(customer.ownerId || '');
      if (!superiorIds.includes(userId)) {
        throw new ForbiddenException('无权为该客户添加跟进记录');
      }
    }

    const followUp = this.followUpRepo.create({
      objectType: 'customer',
      objectId: customerId,
      type: data.type || 'call',
      content: data.content,
      outcome: data.outcome,
      nextAction: data.next_action || data.nextAction,
      nextActionDate: data.next_action_date || data.nextActionDate,
      createdBy: userId,
    });

    return this.followUpRepo.save(followUp);
  }

  /**
   * 获取客户跟进记录
   * 上下级都可以查看客户跟进记录
   */
  async getFollowUps(customerId: string, userId?: string): Promise<FollowUp[]> {
    const customer = await this.findOne(customerId);

    // 检查数据权限
    if (userId) {
      const accessibleIds = await this.dataPermissionService.getAccessibleUserIds(userId);
      if (accessibleIds !== null && !accessibleIds.includes(customer.ownerId || '')) {
        // 检查是否是上级
        const superiorIds = await this.dataPermissionService.getSuperiorIds(customer.ownerId || '');
        if (!superiorIds.includes(userId)) {
          throw new ForbiddenException('无权查看该客户的跟进记录');
        }
      }
    }

    return this.followUpRepo.find({
      where: { objectType: 'customer', objectId: customerId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }
}
