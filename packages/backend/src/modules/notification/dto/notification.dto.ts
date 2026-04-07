import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  resourceType?: string;

  @IsUUID()
  @IsOptional()
  resourceId?: string;
}

export class UpdateNotificationDto {
  @IsBoolean()
  isRead: boolean;
}

export class NotificationQueryDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
