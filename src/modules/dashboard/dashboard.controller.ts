import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('stats')
  stats() {
    return this.svc.getStats();
  }

  @Get('evolution')
  evolution() {
    return this.svc.getEvolution();
  }

  @Get('pipeline')
  pipeline() {
    return this.svc.getPipeline();
  }
}