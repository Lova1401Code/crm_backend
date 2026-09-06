import {
  Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { DealsService } from './deals.service';
import { CreateDealDto, UpdateDealDto } from './dto/deal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { toCsv } from '../../common/utils/csv';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly svc: DealsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() q: PaginationDto & { stage?: string }) {
    const filters: Record<string, unknown> = {};
    if (q.stage) filters.stage = q.stage;
    if (q.ownerId) filters.ownerId = q.ownerId;
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
      { key: 'title', label: 'Titre' },
      { key: 'customerId', label: 'Client ID' },
      { key: 'amount', label: 'Montant' },
      { key: 'stage', label: 'Étape' },
      { key: 'expectedCloseDate', label: 'Date de clôture' },
      { key: 'createdAt', label: 'Créé le' },
    ]);
    res.setHeader('Content-Disposition', `attachment; filename="affaires-${Date.now()}.csv"`);
    res.send(csv);
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