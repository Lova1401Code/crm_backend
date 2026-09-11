import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { TokenService } from '../../infrastructure/security/token.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'crm-dev-secret-change-me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as unknown as number },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, TokenService],
  exports: [AuthService, TokenService, PasswordHasherService, JwtModule],
})
export class AuthModule {}