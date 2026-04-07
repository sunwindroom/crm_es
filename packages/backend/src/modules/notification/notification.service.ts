import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto, NotificationQueryDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  async sendBatch(dtos: CreateNotificationDto[]): Promise<Notification[]> {
    const notifications = this.notificationRepository.create(dtos);
    return this.notificationRepository.save(notifications);
  }

  async findAll(userId: string, query: NotificationQueryDto): Promise<{ data: Notification[]; total: number }> {
    const { isRead, type, page = 1, limit = 20 } = query;
    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }
    if (type) {
      where.type = type;
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return { data, total };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
      relations: ['user'],
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }
}
