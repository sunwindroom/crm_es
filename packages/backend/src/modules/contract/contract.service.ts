import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, DataSource } from 'typeorm';
import { Contract, ContractStatus } from './entities/contract.entity';
import { PaymentNode } from './entities/payment-node.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { User, UserRole } from '../user/entities/user.entity';
import { Project, ProjectStatus, ProjectType } from '../project/entities/project.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private repo: Repository<Contract>,
    @InjectRepository(PaymentNode) private paymentNodeRepo: Repository<PaymentNode>,
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataPermissionService: DataPermissionService,
    private dataSource: DataSource,
  ) {}

  /**
   * 创建合同
   * 总裁、技术副总裁、营销副总裁、商务或系统管理员可以新建合同
   */
  async create(dto: any, userId: string): Promise<Contract> {
    // 检查权限
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');

    const canCreate = [
      UserRole.ADMIN,
      UserRole.CEO,
      UserRole.CTO,
      UserRole.CMO,
      UserRole.BUSINESS,
    ].includes(user.role);

    if (!canCreate) {
      throw new ForbiddenException('只有总裁、技术副总裁、营销副总裁、商务或系统管理员可以新建合同');
    }

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

    // 如果有回款节点，创建回款节点
    if (dto.paymentNodes && Array.isArray(dto.paymentNodes) && dto.paymentNodes.length > 0) {
      for (const node of dto.paymentNodes) {
        await this.addPaymentNode(saved.id, node, userId);
      }
    }

    return this.findOne(saved.id);
  }

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, status, customerId, keyword } = q;
    const base: any = {};
    if (status) base.status = status;
    if (customerId) base.customerId = customerId;

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

  async findOne(id: string, userId?: string): Promise<Contract> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'creator', 'owner'],
    });
    if (!c) throw new NotFoundException('合同不存在');

    // 检查数据权限
    if (userId) {
      const canViewAll = await this.dataPermissionService.canViewAllData(userId);
      if (!canViewAll) {
        // 检查是否是合同负责人或创建者
        if (c.ownerId !== userId && c.createdBy !== userId) {
          throw new ForbiddenException('无权访问该合同');
        }
      }
    }

    return c;
  }

  async update(id: string, dto: any, userId: string): Promise<Contract> {
    const c = await this.findOne(id, userId);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('只有草稿状态可修改');

    // 检查权限：只有创建者或管理员可以修改
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && c.createdBy !== userId) {
      throw new ForbiddenException('只有创建者或管理员可以修改合同');
    }

    Object.assign(c, dto);
    await this.repo.save(c);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const c = await this.findOne(id, userId);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('只有草稿状态可删除');

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除合同');
    }

    await this.repo.remove(c);
  }

  async submitForApproval(id: string, userId: string): Promise<Contract> {
    const c = await this.findOne(id, userId);
    if (c.status !== ContractStatus.DRAFT) throw new BadRequestException('状态不符');

    // 检查是否有回款节点
    const nodes = await this.paymentNodeRepo.find({ where: { contractId: id } });
    if (nodes.length === 0) {
      throw new BadRequestException('合同必须至少有一个回款时间节点');
    }

    c.status = ContractStatus.PENDING;
    await this.repo.save(c);
    return this.findOne(id);
  }

  async approve(id: string, userId: string): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.PENDING) throw new BadRequestException('状态不符');

    // 检查权限：总裁或管理员可以审批
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || ![UserRole.ADMIN, UserRole.CEO].includes(user.role)) {
      throw new ForbiddenException('只有总裁或系统管理员可以审批合同');
    }

    c.status = ContractStatus.APPROVED;
    c.approvedBy = userId;
    c.approvedAt = new Date();
    await this.repo.save(c);
    return this.findOne(id);
  }

  async reject(id: string, userId: string): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.PENDING) throw new BadRequestException('状态不符');

    // 检查权限：总裁或管理员可以驳回
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || ![UserRole.ADMIN, UserRole.CEO].includes(user.role)) {
      throw new ForbiddenException('只有总裁或系统管理员可以驳回合同');
    }

    c.status = ContractStatus.DRAFT;
    await this.repo.save(c);
    return this.findOne(id);
  }

  async sign(id: string, signDate: Date, userId: string): Promise<Contract> {
    const c = await this.findOne(id);
    if (c.status !== ContractStatus.APPROVED) throw new BadRequestException('状态不符');

    // 检查权限：商务或管理员可以签订
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || ![UserRole.ADMIN, UserRole.BUSINESS].includes(user.role)) {
      throw new ForbiddenException('只有商务或系统管理员可以签订合同');
    }

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

  /**
   * 添加回款节点
   * 新建合同必须指定各个回款时间节点，至少1个回款时间节点
   */
  async addPaymentNode(contractId: string, data: any, userId: string) {
    const contract = await this.findOne(contractId, userId);

    // 检查权限：合同创建者或管理员可以添加回款节点
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && contract.createdBy !== userId) {
      throw new ForbiddenException('只有合同创建者或管理员可以添加回款节点');
    }

    const node = this.paymentNodeRepo.create({
      contractId,
      name: data.name || `回款节点`,
      amount: data.amount,
      plannedDate: data.plannedDate,
      description: data.description,
      status: 'pending',
    });

    return this.paymentNodeRepo.save(node);
  }

  /**
   * 获取合同的回款节点列表
   */
  async getPaymentNodes(contractId: string, userId?: string) {
    await this.findOne(contractId, userId);
    return this.paymentNodeRepo.find({
      where: { contractId },
      order: { plannedDate: 'ASC' },
    });
  }

  /**
   * 更新回款节点
   */
  async updatePaymentNode(nodeId: string, data: any, userId: string) {
    const node = await this.paymentNodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('回款节点不存在');

    const contract = await this.findOne(node.contractId, userId);

    // 检查权限
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && contract.createdBy !== userId) {
      throw new ForbiddenException('只有合同创建者或管理员可以更新回款节点');
    }

    Object.assign(node, data);
    return this.paymentNodeRepo.save(node);
  }

  /**
   * 删除回款节点
   */
  async removePaymentNode(nodeId: string, userId: string) {
    const node = await this.paymentNodeRepo.findOne({ where: { id: nodeId } });
    if (!node) throw new NotFoundException('回款节点不存在');

    const contract = await this.findOne(node.contractId, userId);

    // 检查权限
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && contract.createdBy !== userId) {
      throw new ForbiddenException('只有合同创建者或管理员可以删除回款节点');
    }

    // 检查是否是最后一个回款节点
    const nodes = await this.paymentNodeRepo.find({ where: { contractId: node.contractId } });
    if (nodes.length <= 1) {
      throw new BadRequestException('合同必须至少有一个回款时间节点');
    }

    await this.paymentNodeRepo.remove(node);
    return { message: '回款节点删除成功' };
  }

  /**
   * 项目经理指派
   * 技术副总裁指派合同执行的项目经理，即将纳入项目管理
   */
  async assignManager(contractId: string, managerId: string, userId: string) {
    const contract = await this.findOne(contractId);

    // 检查权限：技术副总裁或管理员可以指派项目经理
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || ![UserRole.ADMIN, UserRole.CTO].includes(user.role)) {
      throw new ForbiddenException('只有技术副总裁或系统管理员可以指派项目经理');
    }

    // 检查目标用户是否存在
    const manager = await this.userRepo.findOne({ where: { id: managerId } });
    if (!manager) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查合同是否已签订
    if (contract.status !== ContractStatus.SIGNED) {
      throw new BadRequestException('只有已签订的合同可以指派项目经理');
    }

    // 使用事务创建项目并更新合同
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建项目
      const project = queryRunner.manager.create(Project, {
        name: `${contract.name} - 项目`,
        customerId: contract.customerId,
        contractId: contract.id,
        type: ProjectType.DEVELOPMENT,
        status: ProjectStatus.PLANNING,
        manager: managerId,
        startDate: new Date(),
        endDate: contract.endDate,
        budget: contract.amount,
        createdBy: userId,
      });

      await queryRunner.manager.save(project);

      // 更新合同状态和项目ID
      await queryRunner.manager.update(Contract, contractId, {
        projectId: project.id,
        status: ContractStatus.EXECUTING,
      });

      await queryRunner.commitTransaction();

      return { message: '项目经理指派成功', projectId: project.id, managerId };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
