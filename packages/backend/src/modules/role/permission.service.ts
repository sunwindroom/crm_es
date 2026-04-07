import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  /**
   * 获取所有权限
   */
  async findAll(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * 根据ID获取权限
   */
  async findOne(id: string): Promise<Permission> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  /**
   * 根据代码获取权限
   */
  async findByCode(code: string): Promise<Permission> {
    return this.permissionRepository.findOne({ where: { code } });
  }

  /**
   * 根据资源获取权限列表
   */
  async findByResource(resource: string): Promise<Permission[]> {
    return this.permissionRepository.find({
      where: { resource },
      order: { action: 'ASC' },
    });
  }

  /**
   * 创建权限
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return this.permissionRepository.save(permission);
  }

  /**
   * 更新权限
   */
  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    await this.permissionRepository.update(id, updatePermissionDto);
    return this.findOne(id);
  }

  /**
   * 删除权限
   */
  async remove(id: string): Promise<void> {
    await this.permissionRepository.delete(id);
  }

  /**
   * 批量获取权限
   */
  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.permissionRepository.findByIds(ids);
  }
}
