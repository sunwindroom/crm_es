import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Milestone, MilestoneStatus } from './entities/milestone.entity';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectTimesheet } from './entities/project-timesheet.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';
import { AuditLogService } from '../../common/services/audit-log.service';
import { AuditAction, AuditResource } from '../audit/entities/audit-log.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(ProjectMember) private memberRepo: Repository<ProjectMember>,
    @InjectRepository(ProjectTimesheet) private timesheetRepo: Repository<ProjectTimesheet>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataPermissionService: DataPermissionService,
    private notificationService: NotificationService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * 创建项目
   * 只有总裁、技术副总裁、营销副总裁、商务或系统管理员可以新建项目
   */
  async create(dto: any, userId: string): Promise<Project> {
    // 检查权限
    const canCreate = await this.dataPermissionService.isProjectRole(userId);
    if (!canCreate) {
      throw new ForbiddenException('只有总裁、技术副总裁、营销副总裁、商务或系统管理员可以新建项目');
    }

    const entity = this.projectRepo.create({ ...dto, createdBy: userId });
    const saved = (await this.projectRepo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any, userId?: string) {
    const { page = 1, pageSize = 10, type, status, manager, keyword } = q;
    const base: any = {};
    if (type) base.type = type;
    if (status) base.status = status;
    if (manager) base.manager = manager;

    // 添加数据权限过滤
    if (userId) {
      const canViewAll = await this.dataPermissionService.canViewAllData(userId);
      // 如果不能查看所有数据，则只查看自己参与的项目
      if (!canViewAll) {
        // 获取用户参与的项目ID列表（作为项目经理或成员）
        const memberProjects = await this.memberRepo.find({
          where: { userId },
          select: ['projectId'],
        });
        const projectIds = memberProjects.map(m => m.projectId);
        
        // 构建查询条件：项目经理是自己 或 项目ID在参与列表中
        return this.findByUserParticipation(userId, projectIds, q);
      }
    }

    let where: any = base;
    if (keyword) {
      where = [{ ...base, name: Like(`%${keyword}%`) }];
    }

    const total = await this.projectRepo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.projectRepo.find({
      where,
      relations: ['customer', 'managerUser', 'csManagerUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  /**
   * 根据用户参与情况查询项目
   * 包括：项目经理、客服经理、项目成员
   */
  private async findByUserParticipation(userId: string, projectIds: string[], q: any) {
    const { page = 1, pageSize = 10, type, status, keyword } = q;

    const qb = this.projectRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.customer', 'customer')
      .leftJoinAndSelect('p.managerUser', 'managerUser')
      .leftJoinAndSelect('p.csManagerUser', 'csManagerUser')
      .orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // 构建查询条件：项目经理、客服经理或项目成员
    const conditions = ['p.manager = :userId', 'p.cs_manager = :userId'];
    if (projectIds.length > 0) {
      conditions.push('p.id IN (:...projectIds)');
    }
    qb.where(`(${conditions.join(' OR ')})`, { userId, projectIds });

    if (type) qb.andWhere('p.type = :type', { type });
    if (status) qb.andWhere('p.status = :status', { status });
    if (keyword) qb.andWhere('p.name LIKE :keyword', { keyword: `%${keyword}%` });

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string, userId?: string): Promise<Project> {
    const p = await this.projectRepo.findOne({
      where: { id },
      relations: ['customer', 'managerUser', 'csManagerUser', 'milestones', 'milestones.assigneeUser'],
    });
    if (!p) throw new NotFoundException('项目不存在');

    // 检查数据权限
    if (userId) {
      const canViewAll = await this.dataPermissionService.canViewAllData(userId);
      if (!canViewAll) {
        // 检查是否是项目经理、客服经理或成员
        const isManager = p.manager === userId;
        const isCsManager = p.csManager === userId;
        const isMember = await this.memberRepo.findOne({ where: { projectId: id, userId } });
        if (!isManager && !isCsManager && !isMember) {
          throw new ForbiddenException('无权访问该项目');
        }
      }
    }

    return p;
  }

  async update(id: string, dto: any, userId: string): Promise<Project> {
    const p = await this.findOne(id, userId);

    // 检查权限：使用canManageProject
    const canManage = await this.canManageProject(id, userId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、CTO、CEO或系统管理员可以编辑项目');
    }

    Object.assign(p, dto);
    await this.projectRepo.save(p);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const p = await this.findOne(id, userId);

    // 检查权限：只有系统管理员可以删除
    const canDelete = await this.dataPermissionService.canDeleteData(userId);
    if (!canDelete) {
      throw new ForbiddenException('只有系统管理员可以删除项目');
    }

    await this.projectRepo.remove(p);
  }

  async updateStatus(id: string, status: ProjectStatus, userId: string): Promise<Project> {
    const p = await this.findOne(id, userId);

    // 检查权限：项目经理或管理员可以更新状态
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && p.manager !== userId) {
      throw new ForbiddenException('只有项目经理或管理员可以更新项目状态');
    }

    p.status = status;
    await this.projectRepo.save(p);
    return this.findOne(id);
  }

  async addMilestone(projectId: string, data: any, userId: string): Promise<Milestone> {
    const project = await this.findOne(projectId, userId);

    // 检查权限：使用canManageProject
    const canManage = await this.canManageProject(projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、CTO、CEO或系统管理员可以添加里程碑');
    }

    const entity = this.milestoneRepo.create({ ...data, projectId });
    return (await this.milestoneRepo.save(entity)) as unknown as Milestone;
  }

  async getMilestones(projectId: string, userId?: string): Promise<Milestone[]> {
    await this.findOne(projectId, userId);
    return this.milestoneRepo.find({
      where: { projectId },
      relations: ['assigneeUser'],
      order: { plannedDate: 'ASC' },
    });
  }

  async updateMilestone(id: string, data: any, userId: string): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');

    const project = await this.findOne(m.projectId, userId);
    // 检查权限：使用canManageProject
    const canManage = await this.canManageProject(m.projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、CTO、CEO或系统管理员可以更新里程碑');
    }

    Object.assign(m, data);
    return (await this.milestoneRepo.save(m)) as unknown as Milestone;
  }

  async deleteMilestone(id: string, userId: string): Promise<void> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');

    const project = await this.findOne(m.projectId, userId);
    // 检查权限：使用canManageProject
    const canManage = await this.canManageProject(m.projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、CTO、CEO或系统管理员可以删除里程碑');
    }

    await this.milestoneRepo.remove(m);
  }

  async updateMilestoneStatus(id: string, status: MilestoneStatus, data: any, userId: string): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');

    const project = await this.findOne(m.projectId, userId);
    // 检查权限：项目经理或管理员可以更新里程碑状态
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && project.manager !== userId) {
      throw new ForbiddenException('只有项目经理或管理员可以更新里程碑状态');
    }

    m.status = status;
    if (data?.reason) (m as any).delayReason = data.reason;
    return (await this.milestoneRepo.save(m)) as unknown as Milestone;
  }

  async completeMilestone(id: string, data: any, userId: string): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');

    const project = await this.findOne(m.projectId, userId);
    // 检查权限：项目经理或管理员可以完成里程碑
    const canEditAll = await this.dataPermissionService.canEditAllData(userId);
    if (!canEditAll && project.manager !== userId) {
      throw new ForbiddenException('只有项目经理或管理员可以完成里程碑');
    }

    if (m.dependencies?.length) {
      const prereqs = await this.milestoneRepo.find({ where: { id: In(m.dependencies) } });
      const incomplete = prereqs.filter(x => x.status !== MilestoneStatus.COMPLETED);
      if (incomplete.length) {
        throw new BadRequestException(`前置里程碑未完成: ${incomplete.map(x => x.name).join(', ')}`);
      }
    }
    m.status = MilestoneStatus.COMPLETED;
    m.actualDate = data?.actualDate ? new Date(data.actualDate) : new Date();
    const saved = (await this.milestoneRepo.save(m)) as unknown as Milestone;
    await this.checkProjectCompletion(m.projectId);
    return saved;
  }

  async batchDeleteMilestones(ids: string[], userId: string): Promise<void> {
    if (!ids?.length) return;
    const items = await this.milestoneRepo.find({ where: { id: In(ids) } });
    if (items.length) {
      // 检查权限
      const projectIds = [...new Set(items.map(m => m.projectId))];
      for (const projectId of projectIds) {
        await this.findOne(projectId, userId);
      }
      await this.milestoneRepo.remove(items);
    }
  }

  /**
   * 项目经理指派
   * 只有技术副总裁、系统管理员、总裁可以指派项目经理
   */
  async assignManager(id: string, managerId: string, userId: string) {
    const project = await this.findOne(id);

    // 检查权限：技术副总裁、系统管理员、总裁可以指派项目经理
    const canAssign = await this.dataPermissionService.canAssignManager(userId);
    if (!canAssign) {
      throw new ForbiddenException('只有技术副总裁、系统管理员或总裁可以指派项目经理');
    }

    // 检查目标用户是否存在
    const manager = await this.userRepo.findOne({ where: { id: managerId } });
    if (!manager) {
      throw new NotFoundException('目标用户不存在');
    }

    // 验证被分配用户角色为项目经理
    if (manager.role !== UserRole.PROJECT_MANAGER) {
      throw new BadRequestException('该用户不是项目经理角色，无法分配');
    }

    // 验证被分配用户状态为激活
    if (manager.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('该用户账号已禁用或锁定，无法分配');
    }

    // 更新项目经理
    const oldManagerId = project.manager;
    project.manager = managerId;
    await this.projectRepo.save(project);

    // 同步更新project_members表
    // 如果原项目经理存在，更新其角色为member
    if (oldManagerId) {
      const oldManagerMember = await this.memberRepo.findOne({
        where: { projectId: id, userId: oldManagerId },
      });
      if (oldManagerMember) {
        oldManagerMember.role = 'member';
        await this.memberRepo.save(oldManagerMember);
      }
    }

    // 添加或更新新项目经理的成员记录
    let newManagerMember = await this.memberRepo.findOne({
      where: { projectId: id, userId: managerId },
    });
    if (newManagerMember) {
      newManagerMember.role = 'manager';
      await this.memberRepo.save(newManagerMember);
    } else {
      newManagerMember = this.memberRepo.create({
        projectId: id,
        userId: managerId,
        role: 'manager',
      });
      await this.memberRepo.save(newManagerMember);
    }

    // TODO: 发送通知给新项目经理
    // TODO: 记录审计日志

    return this.findOne(id);
  }

  /**
   * 添加项目成员
   * 项目经理可以选择任意角色的用户作为项目成员
   */
  async addMember(projectId: string, memberUserId: string, role: 'manager' | 'member', userId: string) {
    const project = await this.findOne(projectId, userId);

    // 检查权限：项目经理、CTO、Admin、CEO可以添加成员
    const canManage = await this.dataPermissionService.canManageMembers(userId, projectId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、技术副总裁、系统管理员或总裁可以添加项目成员');
    }

    // 检查目标用户
    const targetUser = await this.userRepo.findOne({ where: { id: memberUserId } });
    if (!targetUser) {
      throw new NotFoundException('用户不存在');
    }

    // 验证用户状态为激活
    if (targetUser.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('该用户账号已禁用或锁定，无法添加');
    }

    // 检查成员是否已存在
    const existing = await this.memberRepo.findOne({
      where: { projectId, userId: memberUserId },
    });
    if (existing) {
      throw new BadRequestException('该用户已是项目成员');
    }

    // 检查项目成员数量限制（最多100人）
    const memberCount = await this.memberRepo.count({ where: { projectId } });
    if (memberCount >= 100) {
      throw new BadRequestException('项目成员数量已达上限（100人）');
    }

    // 禁止将项目经理添加为普通成员
    if (project.manager === memberUserId && role === 'member') {
      throw new BadRequestException('项目经理已存在，无需重复添加');
    }

    const member = this.memberRepo.create({
      projectId,
      userId: memberUserId,
      role,
    });

    const savedMember = await this.memberRepo.save(member);

    // TODO: 发送通知给新成员
    // TODO: 记录审计日志

    return savedMember;
  }

  /**
   * 获取项目成员列表
   */
  async getMembers(projectId: string, userId?: string) {
    await this.findOne(projectId, userId);
    return this.memberRepo.find({
      where: { projectId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * 删除项目成员
   */
  async removeMember(projectId: string, memberId: string, userId: string) {
    const project = await this.findOne(projectId, userId);

    // 检查权限：使用canManageProject
    const canManage = await this.canManageProject(projectId, userId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、CTO、CEO或系统管理员可以删除项目成员');
    }

    const member = await this.memberRepo.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('项目成员不存在');
    }

    await this.memberRepo.remove(member);
    return { message: '成员删除成功' };
  }

  /**
   * 添加项目工时
   * 项目参与人员每周填写项目工时
   */
  async addTimesheet(projectId: string, data: any, userId: string) {
    // 检查项目参与权限
    const canView = await this.dataPermissionService.canViewProject(userId, projectId);
    if (!canView) {
      throw new ForbiddenException('无权在该项目中填报工时');
    }

    // 数据校验
    const hours = Number(data.hours);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      throw new BadRequestException('工时数必须在0-24之间');
    }

    const workDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (workDate > today) {
      throw new BadRequestException('工作日期不能晚于当前日期');
    }

    const timesheet = this.timesheetRepo.create({
      projectId,
      userId,
      date: workDate,
      hours,
      workContent: data.workContent,
      description: data.description,
      remark: data.remark,
      createdBy: userId,
    });

    const savedTimesheet = await this.timesheetRepo.save(timesheet);

    // 自动更新项目进度
    await this.updateProjectProgress(projectId);

    return savedTimesheet;
  }

  /**
   * 获取项目工时列表
   * 工程师只能看自己的工时
   * 项目经理可以看项目所有成员的工时
   * 副总裁/总裁/管理员可以看所有工时
   */
  async getTimesheets(projectId: string, query: any, userId?: string) {
    await this.findOne(projectId, userId);

    const { startDate, endDate, userId: filterUserId } = query;
    const where: any = { projectId };

    // 权限控制
    if (userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      // 工程师只能看自己的工时
      if (user?.role === UserRole.ENGINEER) {
        where.userId = userId;
      }
      // 项目经理可以看自己负责项目的所有工时
      else if (user?.role === UserRole.PROJECT_MANAGER) {
        const project = await this.projectRepo.findOne({ where: { id: projectId } });
        if (project?.manager !== userId) {
          // 如果不是项目经理，检查是否是项目成员
          const member = await this.memberRepo.findOne({ where: { projectId, userId } });
          if (!member) {
            throw new ForbiddenException('无权查看该项目工时');
          }
          // 项目成员只能看自己的工时
          where.userId = userId;
        }
        // 项目经理可以看所有工时，不添加userId过滤
      }
      // 其他角色（副总裁、总裁、管理员）可以看所有工时
    }

    // 如果指定了用户过滤，且当前用户有权限查看
    if (filterUserId && !where.userId) {
      where.userId = filterUserId;
    }

    const timesheets = await this.timesheetRepo.find({
      where,
      relations: ['user'],
      order: { date: 'DESC' },
    });

    // 如果指定了日期范围，进行过滤
    let filtered = timesheets;
    if (startDate || endDate) {
      filtered = timesheets.filter(t => {
        const date = new Date(t.date);
        if (startDate && date < new Date(startDate)) return false;
        if (endDate && date > new Date(endDate)) return false;
        return true;
      });
    }

    return filtered;
  }

  /**
   * 修改工时记录
   */
  async updateTimesheet(projectId: string, timesheetId: string, data: any, userId: string) {
    const timesheet = await this.timesheetRepo.findOne({
      where: { id: timesheetId, projectId },
    });
    
    if (!timesheet) {
      throw new NotFoundException('工时记录不存在');
    }
    
    // 只能修改自己的工时
    if (timesheet.userId !== userId) {
      throw new ForbiddenException('只能修改自己的工时记录');
    }
    
    // 数据校验
    if (data.hours) {
      const hours = Number(data.hours);
      if (isNaN(hours) || hours <= 0 || hours > 24) {
        throw new BadRequestException('工时数必须在0-24之间');
      }
    }
    
    if (data.date) {
      const workDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (workDate > today) {
        throw new BadRequestException('工作日期不能晚于当前日期');
      }
    }

    Object.assign(timesheet, data);
    const updatedTimesheet = await this.timesheetRepo.save(timesheet);

    // 自动更新项目进度
    await this.updateProjectProgress(projectId);

    return updatedTimesheet;
  }

  /**
   * 删除工时记录
   */
  async deleteTimesheet(projectId: string, timesheetId: string, userId: string) {
    const timesheet = await this.timesheetRepo.findOne({
      where: { id: timesheetId, projectId },
    });

    if (!timesheet) {
      throw new NotFoundException('工时记录不存在');
    }
    
    // 只能删除自己的工时
    if (timesheet.userId !== userId) {
      throw new ForbiddenException('只能删除自己的工时记录');
    }

    await this.timesheetRepo.remove(timesheet);

    // 自动更新项目进度
    await this.updateProjectProgress(projectId);

    return { message: '工时记录删除成功' };
  }

  /**
   * 自动更新项目进度
   * 根据已填报工时和评估工时计算进度
   */
  private async updateProjectProgress(projectId: string): Promise<void> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project || !project.estimatedHours) {
      // 如果项目不存在或未评估工时，不更新进度
      return;
    }

    // 获取项目所有工时记录
    const timesheets = await this.timesheetRepo.find({
      where: { projectId },
    });

    // 计算总填报工时
    const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours), 0);

    // 计算进度百分比
    let progress = 0;
    if (project.estimatedHours > 0) {
      progress = Math.min(100, Math.round((totalHours / project.estimatedHours) * 100));
    }

    // 更新项目进度
    await this.projectRepo.update(projectId, { progress });
  }

  /**
   * 获取项目统计数据
   * 自动统计所有工时并计算项目进度以及工时成本
   */
  async getProjectStats(id: string, userId?: string) {
    const project = await this.findOne(id, userId);

    // 获取所有工时记录
    const timesheets = await this.timesheetRepo.find({
      where: { projectId: id },
      relations: ['user'],
    });
    const totalHours = timesheets.reduce((sum, t) => sum + Number(t.hours), 0);

    // 成员工时统计
    const memberStats = new Map<string, { userId: string; userName: string; hours: number }>();
    for (const t of timesheets) {
      const uid = t.userId;
      if (!memberStats.has(uid)) {
        memberStats.set(uid, {
          userId: uid,
          userName: t.user?.name || '-',
          hours: 0,
        });
      }
      memberStats.get(uid)!.hours += Number(t.hours);
    }

    // 获取里程碑统计
    const milestones = await this.milestoneRepo.find({ where: { projectId: id } });
    const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
    const totalMilestones = milestones.length;

    // 计算项目进度（基于里程碑完成率）
    const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

    // 计算工时成本（假设每小时成本为100元，实际应从用户或配置中获取）
    const hourlyRate = 100;
    const totalCost = totalHours * hourlyRate;

    // 获取项目成员数量
    const memberCount = await this.memberRepo.count({ where: { projectId: id } });

    return {
      projectId: id,
      totalHours,
      totalCost,
      progress,
      completedMilestones,
      totalMilestones,
      memberCount,
      timesheetCount: timesheets.length,
      memberStats: Array.from(memberStats.values()),
    };
  }

  /**
   * 获取项目甘特图数据
   */
  async getGanttData(projectId: string, userId?: string) {
    const project = await this.findOne(projectId, userId);
    const milestones = await this.milestoneRepo.find({
      where: { projectId },
      relations: ['assigneeUser'],
      order: { plannedDate: 'ASC' },
    });

    // 构建甘特图数据
    const tasks = milestones.map(m => ({
      id: m.id,
      name: m.name,
      start: m.plannedDate,
      end: m.actualDate || m.plannedDate,
      progress: m.status === MilestoneStatus.COMPLETED ? 100 : 
                m.status === MilestoneStatus.IN_PROGRESS ? 50 : 0,
      status: m.status,
      assignee: m.assigneeUser?.name || '-',
      dependencies: m.dependencies || [],
    }));

    return {
      project: {
        id: project.id,
        name: project.name,
        start: project.startDate,
        end: project.endDate,
        status: project.status,
      },
      tasks,
    };
  }

  private async checkProjectCompletion(projectId: string): Promise<void> {
    const milestones = await this.milestoneRepo.find({ where: { projectId } });
    const allDone = milestones.length > 0 &&
      milestones.every(m => m.status === MilestoneStatus.COMPLETED);
    if (allDone) {
      await this.projectRepo.update(projectId, { status: ProjectStatus.COMPLETED });
    }
  }

  /**
   * 批量添加项目成员
   * 项目经理、CTO、Admin、CEO可以批量添加成员
   */
  async addMembersBatch(projectId: string, userIds: string[], userId: string) {
    const project = await this.findOne(projectId, userId);

    // 检查权限：项目经理、CTO、Admin、CEO可以添加成员
    const canManage = await this.dataPermissionService.canManageMembers(userId, projectId);
    if (!canManage) {
      throw new ForbiddenException('只有项目经理、技术副总裁、系统管理员或总裁可以添加项目成员');
    }

    // 检查项目成员数量限制
    const currentMemberCount = await this.memberRepo.count({ where: { projectId } });
    if (currentMemberCount + userIds.length > 100) {
      throw new BadRequestException('项目成员数量将超过上限（100人）');
    }

    const successUsers: string[] = [];
    const failedUsers: Array<{ userId: string; reason: string }> = [];

    // 批量处理用户
    for (const targetUserId of userIds) {
      try {
        // 检查目标用户
        const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
        if (!targetUser) {
          failedUsers.push({ userId: targetUserId, reason: '用户不存在' });
          continue;
        }

        // 验证用户状态为激活
        if (targetUser.status !== UserStatus.ACTIVE) {
          failedUsers.push({ userId: targetUserId, reason: '用户账号已禁用或锁定' });
          continue;
        }

        // 检查成员是否已存在
        const existing = await this.memberRepo.findOne({
          where: { projectId, userId: targetUserId },
        });
        if (existing) {
          failedUsers.push({ userId: targetUserId, reason: '用户已是项目成员' });
          continue;
        }

        // 禁止将项目经理添加为普通成员
        if (project.manager === targetUserId) {
          failedUsers.push({ userId: targetUserId, reason: '项目经理已存在' });
          continue;
        }

        // 添加成员
        const member = this.memberRepo.create({
          projectId,
          userId: targetUserId,
          role: 'member',
        });
        await this.memberRepo.save(member);
        successUsers.push(targetUserId);
      } catch (error) {
        failedUsers.push({ userId: targetUserId, reason: error.message || '添加失败' });
      }
    }

    // TODO: 批量发送通知给新成员
    // TODO: 记录审计日志

    return {
      message: `成功添加 ${successUsers.length} 个成员，失败 ${failedUsers.length} 个`,
      successCount: successUsers.length,
      failedCount: failedUsers.length,
      failedUsers,
    };
  }

  /**
   * 检查用户是否可以管理项目
   * CTO/CEO/ADMIN 或项目负责人可以管理
   */
  async canManageProject(projectId: string, userId: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;

    // CTO/CEO/ADMIN 有全部权限
    if ([UserRole.CTO, UserRole.CEO, UserRole.ADMIN].includes(user.role)) {
      return true;
    }

    // 项目经理检查是否为项目负责人
    if (user.role === UserRole.PROJECT_MANAGER) {
      const project = await this.projectRepo.findOne({ where: { id: projectId } });
      return project?.manager === userId;
    }

    return false;
  }

  /**
   * 分配客服经理
   * CMO/CEO/ADMIN 可以分配客服经理
   */
  async assignCsManager(projectId: string, csManagerId: string, currentUserId: string): Promise<Project> {
    const project = await this.findOne(projectId);

    // 检查权限：CMO/CEO/ADMIN 可以分配客服经理
    const currentUser = await this.userRepo.findOne({ where: { id: currentUserId } });
    if (!currentUser || ![UserRole.CMO, UserRole.CEO, UserRole.ADMIN].includes(currentUser.role)) {
      throw new ForbiddenException('只有营销副总裁、总裁或系统管理员可以分配客服经理');
    }

    // 验证客服经理
    const csManager = await this.userRepo.findOne({ where: { id: csManagerId } });
    if (!csManager) {
      throw new NotFoundException('客服经理不存在');
    }
    if (csManager.role !== UserRole.CUSTOMER_SERVICE_MANAGER) {
      throw new BadRequestException('指定用户不是客服经理角色');
    }
    if (csManager.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('客服经理账号未激活');
    }

    // 更新项目客服经理
    project.csManager = csManagerId;
    await this.projectRepo.save(project);

    // 发送通知
    await this.notificationService.create({
      userId: csManagerId,
      type: NotificationType.CS_MANAGER_ASSIGNED,
      title: '客服经理分配通知',
      content: `您已被分配为项目"${project.name}"的客服经理，请及时跟进。`,
      resourceType: 'project',
      resourceId: projectId,
    });

    // 记录审计日志
    await this.auditLogService.log({
      action: AuditAction.UPDATE,
      resource: AuditResource.PROJECT,
      resourceId: projectId,
      userId: currentUserId,
      remark: `分配客服经理：${csManager.name}`,
      ip: '0.0.0.0',
      userAgent: 'system',
    });

    return this.findOne(projectId);
  }

  /**
   * 评估项目工时和人力投入
   * 只有项目经理可以评估
   */
  async evaluateWorkload(
    projectId: string,
    data: { estimatedHours: number; estimatedPeople: number; workloadEvaluation?: string },
    userId: string,
  ): Promise<Project> {
    const project = await this.projectRepo.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查权限：只有项目经理可以评估
    if (project.manager !== userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (![UserRole.ADMIN, UserRole.CTO, UserRole.CEO].includes(user.role)) {
        throw new ForbiddenException('只有项目经理可以评估工时');
      }
    }

    // 更新评估信息
    project.estimatedHours = data.estimatedHours;
    project.estimatedPeople = data.estimatedPeople;
    project.workloadEvaluation = data.workloadEvaluation;
    project.evaluationDate = new Date();
    project.evaluatedBy = userId;

    await this.projectRepo.save(project);

    // 自动更新项目进度
    await this.updateProjectProgress(projectId);

    // 记录审计日志
    await this.auditLogService.log({
      userId,
      action: AuditAction.UPDATE,
      resource: AuditResource.PROJECT,
      resourceId: projectId,
      remark: `评估工时：${data.estimatedHours}小时，${data.estimatedPeople}人`,
      ip: '0.0.0.0',
      userAgent: 'system',
    });

    return this.findOne(projectId);
  }
}
