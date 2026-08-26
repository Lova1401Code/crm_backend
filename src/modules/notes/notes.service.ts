import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { NotFoundError, UnauthorizedError } from '../../common/domain/domain-error';
import {
  matchSearch, paginate, uid, nowIso, sortByCreatedAtDesc,
} from '../../common/utils/repo-utils';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NoteRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

@Injectable()
export class NotesService {
  constructor(private readonly db: MockDatabaseService) {}

  async findMany(opts: { page?: number; limit?: number; search?: string; filters?: Record<string, unknown> }) {
    let items = sortByCreatedAtDesc(this.db.notes);
    items = matchSearch(items, opts.search || '', ['content'] as (keyof NoteRecord)[]);
    const filters = opts.filters;
    items = items.filter((n) => !filters || Object.entries(filters).every(([k, v]) => v === undefined || v === null || v === '' || n[k as keyof NoteRecord] === v));
    const total = items.length;
    return { items: paginate(items, opts.page || 1, opts.limit || 10).items, total };
  }

  async create(user: RequestUser, dto: CreateNoteDto): Promise<NoteRecord> {
    const ts = nowIso();
    const rec: NoteRecord = {
      id: uid('n'),
      content: dto.content,
      relatedType: dto.relatedType,
      relatedId: dto.relatedId,
      authorId: user.id,
      createdAt: ts,
      updatedAt: ts,
    };
    this.db.notes.push(rec);
    return rec;
  }

  async update(user: RequestUser, id: string, dto: UpdateNoteDto): Promise<NoteRecord> {
    const idx = this.db.notes.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Note introuvable');
    const n = this.db.notes[idx];
    if (user.role !== 'ADMIN' && n.authorId !== user.id) {
      throw new UnauthorizedError('Accès refusé : vous n\'êtes pas l\'auteur', true);
    }
    const updated: NoteRecord = {
      ...n,
      ...(dto.content !== undefined && { content: dto.content }),
      updatedAt: nowIso(),
    };
    this.db.notes[idx] = updated;
    return updated;
  }

  async remove(user: RequestUser, id: string): Promise<void> {
    const idx = this.db.notes.findIndex((x) => x.id === id);
    if (idx === -1) throw new NotFoundError('Note introuvable');
    const n = this.db.notes[idx];
    if (user.role !== 'ADMIN' && n.authorId !== user.id) {
      throw new UnauthorizedError('Accès refusé : vous n\'êtes pas l\'auteur', true);
    }
    this.db.notes.splice(idx, 1);
  }
}