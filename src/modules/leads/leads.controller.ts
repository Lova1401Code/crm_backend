import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly svc: LeadsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() q: PaginationDto & { status?: string }) {
    const filters: Record<string, unknown> = {};
    if (q.status) filters.status = q.status;
    return this.svc.findMany(user, { page: q.page, limit: q.limit, search: q.search, filters: Object.keys(filters).length ? filters : undefined });
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateLeadDto) {
    return this.svc.create(user, dto);
  }

  @Post(':id/convert')
  async convert(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.convert(user, id);
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}