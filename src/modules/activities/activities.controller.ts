import {
  Body, Controller, Delete, Get, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/activity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly svc: ActivitiesService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() q: PaginationDto & { relatedType?: string; relatedId?: string },
  ) {
    const filters: Record<string, unknown> = {};
    if (q.relatedType) filters.relatedType = q.relatedType;
    if (q.relatedId) filters.relatedId = q.relatedId;
    return this.svc.findMany(user, {
      page: q.page, limit: q.limit, search: q.search,
      filters: Object.keys(filters).length ? filters : undefined,
    });
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateActivityDto) {
    return this.svc.create(user, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}