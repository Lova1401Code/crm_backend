import { Controller, Get, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    const items = this.svc.getNotifications(user);
    return { items, total: items.length };
  }

  @Get('count')
  async count(@CurrentUser() user: RequestUser) {
    return { count: this.svc.getCount(user) };
  }
}