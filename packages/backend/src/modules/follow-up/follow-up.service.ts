import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp } from './entities/follow-up.entity';
import { CreateFollowUpDto } from './dto/create-follow-up.dto';
import { Lead } from '../lead/entities/lead.entity';
import { User } from '../user/entities/user.entity';
import { DataPermissionService } from '../../common/services/data-permission.service';

@Injectable()
export class FollowUpService {
  constructor(
    @InjectRepository(FollowUp)
    private followUpRepository: Repository<FollowUp>,
    @InjectRepository(Lead)
    private leadRepository: Repository<Lead>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataPermissionService: DataPermissionService,
  ) {}

  /**
   * 创建跟进记录（线索）
   */
  async create(createFollowUpDto: CreateFollowUpDto, userId: string): Promise<FollowUp> {
    // 检查线索是否存在
    const lead = await this.leadRepository.findOne({
      where: { id: createFollowUpDto.leadId },
    });

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 使用扩展的权限检查方法
    const canManage = await this.dataPermissionService.canManageCustomer(userId, lead.ownerId);
    if (!canManage) {
      throw new ForbiddenException('无权为该线索添加跟进记录');
    }

    const followUp = this.followUpRepository.create({
      objectType: 'lead',
      objectId: createFollowUpDto.leadId,
      content: createFollowUpDto.content,
      nextAction: createFollowUpDto.nextAction,
      nextActionDate: createFollowUpDto.nextActionDate,
      createdBy: userId,
      type: 'call',
    });

    return this.followUpRepository.save(followUp);
  }

  /**
   * 回复跟进记录
   * 注：新结构不支持回复功能，保留方法以兼容现有代码
   */
  async reply(replyFollowUpDto: any, userId: string): Promise<FollowUp> {
    throw new ForbiddenException('当前版本不支持回复功能');
  }

  /**
   * 点评跟进记录
   * 注：新结构不支持点评功能，保留方法以兼容现有代码
   */
  async comment(commentFollowUpDto: any, userId: string): Promise<FollowUp> {
    throw new ForbiddenException('当前版本不支持点评功能');
  }

  /**
   * 根据线索ID获取跟进记录
   */
  async findByLead(leadId: string, userId: string): Promise<FollowUp[]> {
    // 检查线索是否存在
    const lead = await this.leadRepository.findOne({
      where: { id: leadId },
    });

    if (!lead) {
      throw new NotFoundException('线索不存在');
    }

    // 检查权限：线索归属人及其上级可以查看
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const leadOwner = await this.userRepository.findOne({
      where: { id: lead.ownerId },
    });

    if (
      lead.ownerId !== userId &&
      lead.createdBy !== userId &&
      (!leadOwner || leadOwner.superiorId !== userId)
    ) {
      throw new ForbiddenException('无权查看该线索的跟进记录');
    }

    // 获取跟进记录
    return this.followUpRepository.find({
      where: { objectType: 'lead', objectId: leadId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取跟进记录详情
   */
  async findOne(id: string, userId: string): Promise<FollowUp> {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!followUp) {
      throw new NotFoundException('跟进记录不存在');
    }

    // 根据对象类型检查权限
    if (followUp.objectType === 'lead') {
      const lead = await this.leadRepository.findOne({
        where: { id: followUp.objectId },
      });

      if (!lead) {
        throw new NotFoundException('关联线索不存在');
      }

      const leadOwner = await this.userRepository.findOne({
        where: { id: lead.ownerId },
      });

      if (
        lead.ownerId !== userId &&
        lead.createdBy !== userId &&
        (!leadOwner || leadOwner.superiorId !== userId)
      ) {
        throw new ForbiddenException('无权查看该跟进记录');
      }
    }

    return followUp;
  }

  /**
   * 删除跟进记录
   */
  async remove(id: string, userId: string): Promise<void> {
    const followUp = await this.followUpRepository.findOne({
      where: { id },
    });

    if (!followUp) {
      throw new NotFoundException('跟进记录不存在');
    }

    // 检查权限：只有创建人可以删除
    if (followUp.createdBy !== userId) {
      throw new ForbiddenException('只有创建人可以删除跟进记录');
    }

    await this.followUpRepository.remove(followUp);
  }
}
