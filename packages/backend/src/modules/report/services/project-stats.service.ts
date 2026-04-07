import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Project, ProjectStatus } from '../../project/entities/project.entity';
import { Milestone, MilestoneStatus } from '../../project/entities/milestone.entity';
import { ProjectTimesheet } from '../../project/entities/project-timesheet.entity';
import { User } from '../../user/entities/user.entity';
import { DataPermissionService } from './data-permission.service';
import { ProjectProgressQueryDto, TimesheetQueryDto } from '../dto/project-stats-query.dto';
import { ProjectProgress, TimesheetStats } from '../interfaces/project-stats-data.interface';

@Injectable()
export class ProjectStatsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    @InjectRepository(ProjectTimesheet) private timesheetRepo: Repository<ProjectTimesheet>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private readonly permissionService: DataPermissionService,
  ) {}

  /**
   * 获取项目进度统计
   */
  async getProjectProgress(user: User, query: ProjectProgressQueryDto): Promise<ProjectProgress[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'project');
    
    // 2. 构建查询条件
    const where: any = { ...permissionFilter };
    if (query.status) where.status = query.status;
    if (query.managerId) where.manager = query.managerId;

    // 3. 查询项目及其里程碑
    const projects = await this.projectRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.milestones', 'm')
      .leftJoinAndSelect('p.managerUser', 'manager')
      .where(where)
      .getMany();

    // 4. 计算项目进度
    const progress = projects.map(p => {
      const milestones = p.milestones || [];
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
      const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      // 计算逾期里程碑数
      const now = new Date();
      const overdueMilestones = milestones.filter(m => {
        return m.status !== MilestoneStatus.COMPLETED && new Date(m.plannedDate) < now;
      }).length;

      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        managerName: (p as any).manager?.name || '',
        totalMilestones,
        completedMilestones,
        progress,
        overdueMilestones,
        startDate: p.startDate,
        expectedEndDate: p.endDate,
      };
    });

    return progress;
  }

  /**
   * 获取工时统计
   */
  async getTimesheetStats(user: User, query: TimesheetQueryDto): Promise<TimesheetStats[]> {
    // 1. 构建权限过滤条件
    const permissionFilter = await this.permissionService.buildPermissionFilter(user, 'project');
    
    // 2. 构建查询条件
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.userId) where.userId = query.userId;

    // 3. 查询工时记录
    const timesheets = await this.timesheetRepo.find({
      where,
      relations: ['user', 'project'],
    });

    // 4. 按项目分组统计
    const projectMap = new Map<string, TimesheetStats>();

    timesheets.forEach((t) => {
      const pid = t.projectId;
      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: (t as any).project?.name || '-',
          totalHours: 0,
          estimatedHours: 0, // TODO: 从项目表获取预估工时
          usageRate: 0,
          members: [],
        });
      }

      const project = projectMap.get(pid)!;
      project.totalHours += Number(t.hours);

      // 添加成员工时
      const userId = t.userId;
      const existingMember = project.members.find(m => m.userId === userId);
      if (existingMember) {
        existingMember.hours += Number(t.hours);
      } else {
        project.members.push({
          userId,
          userName: (t as any).user?.name || '',
          hours: Number(t.hours),
        });
      }
    });

    // 5. 计算工时使用率
    const result = Array.from(projectMap.values());
    result.forEach(stat => {
      stat.usageRate = stat.estimatedHours > 0 ? (stat.totalHours / stat.estimatedHours) * 100 : 0;
    });

    return result;
  }
}
