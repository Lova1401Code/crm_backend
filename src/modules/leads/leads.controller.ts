import {
  Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto } from './dto/lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { toCsv } from '../../common/utils/csv';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly svc: LeadsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() q: PaginationDto & { status?: string; source?: string }) {
    const filters: Record<string, unknown> = {};
    if (q.status) filters.status = q.status;
    if (q.source) filters.source = q.source;
    if (q.ownerId) filters.ownerId = q.ownerId;
    if (q.tag) filters.tags = q.tag;
    return this.svc.findMany(user, {
      page: q.page, limit: q.limit, search: q.search,
      filters: Object.keys(filters).length ? filters : undefined,
      sortBy: q.sortBy, sortOrder: q.sortOrder,
      dateFrom: q.dateFrom, dateTo: q.dateTo,
    });
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async export(@CurrentUser() user: RequestUser, @Res() res: Response) {
    const result = await this.svc.findMany(user, { page: 1, limit: 10000 });
    const csv = toCsv(result.items as unknown as Record<string, unknown>[], [
      { key: 'id', label: 'ID' },
      { key: 'firstname', label: 'Prénom' },
      { key: 'lastname', label: 'Nom' },
      { key: 'company', label: 'Entreprise' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'source', label: 'Source' },
      { key: 'status', label: 'Statut' },
      { key: 'tags', label: 'Tags' },
      { key: 'createdAt', label: 'Créé le' },
    ]);
    res.setHeader('Content-Disposition', `attachment; filename="prospects-${Date.now()}.csv"`);
    res.send(csv);
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