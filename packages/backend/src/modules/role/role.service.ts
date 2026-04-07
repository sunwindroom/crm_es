import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private repo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.repo.find({
      order: { createdAt: 'ASC' },
      relations: ['permissionsList'],
    });
  }

  async findOne(id: string): Promise<Role> {
    const r = await this.repo.findOne({
      where: { id },
      relations: ['permissionsList'],
    });
    if (!r) throw new NotFoundException('角色不存在');
    return r;
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.repo.findOne({
      where: { code },
      relations: ['permissionsList'],
    });
  }

  async create(dto: any): Promise<Role> {
    if (await this.repo.findOne({ where: { name: dto.name } })) throw new ConflictException('角色名称已存在');
    if (await this.repo.findOne({ where: { code: dto.code } })) throw new ConflictException('角色代码已存在');
    const perms = Array.isArray(dto.permissions) ? dto.permissions.join(',') : (dto.permissions || '');
    const entity = this.repo.create({ ...dto, permissions: perms });
    return (await this.repo.save(entity)) as unknown as Role;
  }

  async update(id: string, dto: any): Promise<Role> {
    const r = await this.findOne(id);
    if (r.isSystem) throw new ConflictException('系统角色不可修改');
    if (dto.name && dto.name !== r.name) {
      const ex = await this.repo.findOne({ where: { name: dto.name } });
      if (ex) throw new ConflictException('角色名称已存在');
    }
    if (Array.isArray(dto.permissions)) dto.permissions = dto.permissions.join(',');
    Object.assign(r, dto);
    return (await this.repo.save(r)) as unknown as Role;
  }

  async remove(id: string): Promise<void> {
    const r = await this.findOne(id);
    if (r.isSystem) throw new ConflictException('系统角色不可删除');
    await this.repo.remove(r);
  }

  /**
   * 为角色分配权限
   */
  async assignPermissions(id: string, assignPermissionsDto: AssignPermissionsDto): Promise<Role> {
    const role = await this.findOne(id);

    if (role.isSystem) {
      throw new BadRequestException('系统角色权限不可修改');
    }

    // 获取权限列表
    const permissions = await this.permissionRepo.find({
      where: { id: In(assignPermissionsDto.permissionIds) },
    });

    if (permissions.length !== assignPermissionsDto.permissionIds.length) {
      throw new BadRequestException('部分权限不存在');
    }

    // 更新角色权限
    role.permissionsList = permissions;
    await this.repo.save(role);

    return this.findOne(id);
  }

  /**
   * 获取角色的权限列表
   */
  async getPermissions(id: string): Promise<Permission[]> {
    const role = await this.findOne(id);
    return role.permissionsList || [];
  }
}
