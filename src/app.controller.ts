import { Controller, Get, Post } from '@nestjs/common';
import { MockDatabaseService } from './infrastructure/mock/mock-database.service';

@Controller()
export class AppController {
  constructor(private readonly db: MockDatabaseService) {}

  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Post('reset')
  async reset() {
    await this.db.reset();
    return { ok: true };
  }
}