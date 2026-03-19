import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Project, ProjectStatus } from './entities/project.entity';
import { Milestone, MilestoneStatus } from './entities/milestone.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
  ) {}

  async create(dto: any): Promise<Project> {
    const entity = this.projectRepo.create(dto);
    const saved = (await this.projectRepo.save(entity)) as any;
    return this.findOne(saved.id);
  }

  async findAll(q: any) {
    const { page = 1, pageSize = 10, type, status, manager, keyword } = q;
    const base: any = {};
    if (type) base.type = type;
    if (status) base.status = status;
    if (manager) base.manager = manager;

    let where: any = base;
    if (keyword) {
      where = [{ ...base, name: Like(`%${keyword}%`) }];
    }

    const total = await this.projectRepo.count({ where });
    if (total === 0) return { items: [], total: 0 };

    const items = await this.projectRepo.find({
      where,
      relations: ['customer', 'managerUser'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<Project> {
    const p = await this.projectRepo.findOne({
      where: { id },
      relations: ['customer', 'managerUser', 'milestones', 'milestones.assigneeUser'],
    });
    if (!p) throw new NotFoundException('项目不存在');
    return p;
  }

  async update(id: string, dto: any): Promise<Project> {
    const p = await this.findOne(id);
    Object.assign(p, dto);
    await this.projectRepo.save(p);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const p = await this.findOne(id);
    await this.projectRepo.remove(p);
  }

  async updateStatus(id: string, status: ProjectStatus): Promise<Project> {
    const p = await this.findOne(id);
    p.status = status;
    await this.projectRepo.save(p);
    return this.findOne(id);
  }

  async addMilestone(projectId: string, data: any): Promise<Milestone> {
    await this.findOne(projectId);
    const entity = this.milestoneRepo.create({ ...data, projectId });
    return (await this.milestoneRepo.save(entity)) as unknown as Milestone;
  }

  async getMilestones(projectId: string): Promise<Milestone[]> {
    return this.milestoneRepo.find({
      where: { projectId },
      relations: ['assigneeUser'],
      order: { plannedDate: 'ASC' },
    });
  }

  async updateMilestone(id: string, data: any): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');
    Object.assign(m, data);
    return (await this.milestoneRepo.save(m)) as unknown as Milestone;
  }

  async deleteMilestone(id: string): Promise<void> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');
    await this.milestoneRepo.remove(m);
  }

  async updateMilestoneStatus(id: string, status: MilestoneStatus, data?: any): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');
    m.status = status;
    if (data?.reason) (m as any).delayReason = data.reason;
    return (await this.milestoneRepo.save(m)) as unknown as Milestone;
  }

  async completeMilestone(id: string, data?: any): Promise<Milestone> {
    const m = await this.milestoneRepo.findOne({ where: { id } });
    if (!m) throw new NotFoundException('里程碑不存在');
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

  async batchDeleteMilestones(ids: string[]): Promise<void> {
    if (!ids?.length) return;
    const items = await this.milestoneRepo.find({ where: { id: In(ids) } });
    if (items.length) await this.milestoneRepo.remove(items);
  }

  private async checkProjectCompletion(projectId: string): Promise<void> {
    const milestones = await this.milestoneRepo.find({ where: { projectId } });
    const allDone = milestones.length > 0 &&
      milestones.every(m => m.status === MilestoneStatus.COMPLETED);
    if (allDone) {
      await this.projectRepo.update(projectId, { status: ProjectStatus.COMPLETED });
    }
  }
}
