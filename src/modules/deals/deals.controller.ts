import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly svc: DealsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() q: PaginationDto & { stage?: string }) {
    const filters: Record<string, unknown> = {};
    if (q.stage) filters.stage = q.stage;
    return this.svc.findMany(user, { page: q.page, limit: q.limit, search: q.search, filters: Object.keys(filters).length ? filters : undefined });
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateDealDto) {
    return this.svc.create(user, dto);
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}