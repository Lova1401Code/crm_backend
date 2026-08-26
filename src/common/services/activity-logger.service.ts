import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { uid, nowIso } from '../utils/repo-utils';
import { ActivityRecord, RelatedEntityType } from '../../infrastructure/mock/seed';

@Injectable()
export class ActivityLoggerService {
  constructor(private readonly db: MockDatabaseService) {}

  log(opts: {
    type?: 'CALL' | 'EMAIL' | 'MEETING' | 'EVENT';
    subject: string;
    description?: string;
    relatedType: RelatedEntityType;
    relatedId: string;
    ownerId: string | null;
  }): void {
    try {
      const ts = nowIso();
      const rec: ActivityRecord = {
        id: uid('a'),
        type: opts.type || 'EVENT',
        subject: opts.subject,
        description: opts.description || '',
        relatedType: opts.relatedType,
        relatedId: opts.relatedId,
        ownerId: opts.ownerId,
        occurredAt: ts,
        createdAt: ts,
      };
      this.db.activities.unshift(rec);
    } catch {
      // fire-and-forget
    }
  }
}