import { Controller, Post, Body, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/auth.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto);
    return this.authService.login(user);
  }

  @Get('profile')
  async getProfile(@Request() req: any) {
    return req.user.user;
  }

  @Post('logout')
  async logout() {
    return { message: '登出成功' };
  }

  @Public()
  @Post('generate-hash')
  async generateHash(@Body() body: { password: string }) {
    if (process.env.APP_ENV === 'production') {
      return { error: '生产环境不允许使用此接口' };
    }
    const hash = await this.authService.generatePasswordHash(body.password);
    return { password: body.password, hash, sql: `UPDATE users SET password='${hash}' WHERE username='admin';` };
  }
}
