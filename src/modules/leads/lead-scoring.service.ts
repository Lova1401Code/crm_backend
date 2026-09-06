import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { LeadRecord } from '../../infrastructure/mock/seed';
import { RequestUser } from '../../common/guards/jwt-auth.guard';
import { enforceOwnership } from '../../common/rbac/rbac';

const SOURCE_SCORES: Record<string, number> = {
  'Recommandation': 25,
  'Salon professionnel': 20,
  'Appel entrant': 18,
  'Site web': 12,
  'Réseaux sociaux': 8,
};

const STATUS_SCORES: Record<string, number> = {
  NEW: 5,
  CONTACTED: 15,
  INTERESTED: 30,
  NEGOTIATING: 45,
  CONVERTED: 50,
};

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class LeadScoringService {
  constructor(private readonly db: MockDatabaseService) {}

  score(lead: LeadRecord): number {
    let score = 0;

    score += SOURCE_SCORES[lead.source] || 5;
    score += STATUS_SCORES[lead.status] || 0;

    const activities = this.db.activities.filter(
      (a) => a.relatedType === 'LEAD' && a.relatedId === lead.id,
    );
    score += Math.min(activities.length * 5, 20);

    const ageDays = (Date.now() - new Date(lead.createdAt).getTime()) / DAY;
    if (ageDays < 7) score += 10;
    else if (ageDays < 30) score += 5;
    else if (ageDays > 90) score -= 10;

    if (lead.email) score += 3;
    if (lead.phone) score += 2;

    if (lead.tags.includes('Hot')) score += 15;
    if (lead.tags.includes('Stratégique')) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  scoreOne(user: RequestUser, leadId: string): { id: string; score: number } {
    const lead = this.db.leads.find((l) => l.id === leadId);
    if (!lead) throw new Error('Prospect introuvable');
    enforceOwnership(user, lead.ownerId);
    return { id: lead.id, score: this.score(lead) };
  }

  scoreAll(user: RequestUser, leads: LeadRecord[]): Array<LeadRecord & { score: number }> {
    return leads.map((l) => ({ ...l, score: this.score(l) }));
  }
}