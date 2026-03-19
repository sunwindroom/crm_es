import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from '../user/entities/user.entity';
import { LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(loginDto: LoginDto): Promise<User> {
    const { username, password } = loginDto;
    const user = await this.userRepository.findOne({
      where: [{ username }, { phone: username }],
    });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('账号已被禁用或锁定');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('用户名或密码错误');
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);
    return user;
  }

  login(user: User) {
    const payload = { sub: user.id, username: user.username, name: user.name, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id, username: user.username, name: user.name,
        phone: user.phone, email: user.email, department: user.department,
        position: user.position, avatar: user.avatar, role: user.role,
        status: user.status, superiorId: user.superiorId,
      },
    };
  }

  async validateToken(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('用户不存在');
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('账号已被禁用');
    return user;
  }

  async generatePasswordHash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
