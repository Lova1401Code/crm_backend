import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly svc: NotesService) {}

  @Get()
  async list(
    @Query() q: PaginationDto & { relatedType?: string; relatedId?: string; authorId?: string },
  ) {
    const filters: Record<string, unknown> = {};
    if (q.relatedType) filters.relatedType = q.relatedType;
    if (q.relatedId) filters.relatedId = q.relatedId;
    if (q.authorId) filters.authorId = q.authorId;
    return this.svc.findMany({
      page: q.page, limit: q.limit, search: q.search,
      filters: Object.keys(filters).length ? filters : undefined,
    });
  }

  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() dto: CreateNoteDto) {
    return this.svc.create(user, dto);
  }

  @Patch(':id')
  async update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateNoteDto) {
    return this.svc.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.svc.remove(user, id);
    return;
  }
}