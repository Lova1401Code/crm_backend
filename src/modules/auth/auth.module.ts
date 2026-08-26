import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { PasswordHasherService } from '../../infrastructure/security/password-hasher.service';
import { TokenService } from '../../infrastructure/security/token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'crm-dev-secret-change-me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as unknown as number },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MockDatabaseService, PasswordHasherService, TokenService],
  exports: [AuthService, TokenService, MockDatabaseService, PasswordHasherService, JwtModule],
})
export class AuthModule {}