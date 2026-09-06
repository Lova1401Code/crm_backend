import {
  Body, Controller, Delete, Get, Header, Param, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { toCsv } from '../../common/utils/csv';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly svc: CustomersService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query() q: PaginationDto) {
    const filters: Record<string, unknown> = {};
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
      { key: 'city', label: 'Ville' },
      { key: 'country', label: 'Pays' },
      { key: 'tags', label: 'Tags' },
      { key: 'createdAt', label: 'Créé le' },
    ]);
    res.setHeader('Content-Disposition', `attachment; filename="clients-${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get(':id')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.svc.findOne(user, id);
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateCustomerDto) {
    return this.svc.create(user, dto);
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}