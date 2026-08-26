import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService, PublicUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async profile(@CurrentUser() user: RequestUser): Promise<PublicUser> {
    return this.auth.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout() {
    await this.auth.logout();
    return { ok: true };
  }
}