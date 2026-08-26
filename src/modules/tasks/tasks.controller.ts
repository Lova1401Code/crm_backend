import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  @Get()
  async list(
    @CurrentUser() user: RequestUser,
    @Query() q: PaginationDto & { status?: string; relatedType?: string; relatedId?: string },
  ) {
    const filters: Record<string, unknown> = {};
    if (q.status) filters.status = q.status;
    if (q.relatedType) filters.relatedType = q.relatedType;
    if (q.relatedId) filters.relatedId = q.relatedId;
    return this.svc.findMany(user, {
      page: q.page, limit: q.limit, search: q.search,
      filters: Object.keys(filters).length ? filters : undefined,
    });
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateTaskDto) {
    return this.svc.create(user, dto);
  }

  @Post(':id/toggle')
  async toggle(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.toggle(user, id);
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}