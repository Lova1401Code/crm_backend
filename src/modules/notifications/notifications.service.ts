import { Injectable } from '@nestjs/common';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { ownerFilter } from '../../common/rbac/rbac';
import { RequestUser } from '../../common/guards/jwt-auth.guard';

export interface NotificationItem {
  id: string;
  type: 'OVERDUE_TASK' | 'DUE_TODAY_TASK' | 'INACTIVE_LEAD' | 'STALE_DEAL';
  message: string;
  entityId: string;
  entityType: 'TASK' | 'LEAD' | 'DEAL';
  url: string;
  severity: 'high' | 'medium' | 'low';
}

const DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService {
  constructor(private readonly db: MockDatabaseService) {}

  getNotifications(user: RequestUser): NotificationItem[] {
    const notifications: NotificationItem[] = [];
    const owner = ownerFilter(user);
    const today = new Date().toISOString().slice(0, 10);

    const tasks = owner
      ? this.db.tasks.filter((t) => t.ownerId === owner.ownerId)
      : this.db.tasks;

    for (const t of tasks) {
      if (t.status === 'DONE') continue;
      if (!t.dueDate) continue;
      if (t.dueDate < today) {
        notifications.push({
          id: `notif-task-overdue-${t.id}`,
          type: 'OVERDUE_TASK',
          message: `Tâche en retard : ${t.title}`,
          entityId: t.id,
          entityType: 'TASK',
          url: '/tasks',
          severity: 'high',
        });
      } else if (t.dueDate === today) {
        notifications.push({
          id: `notif-task-today-${t.id}`,
          type: 'DUE_TODAY_TASK',
          message: `Tâche à faire aujourd'hui : ${t.title}`,
          entityId: t.id,
          entityType: 'TASK',
          url: '/tasks',
          severity: 'medium',
        });
      }
    }

    const leads = owner
      ? this.db.leads.filter((l) => l.ownerId === owner.ownerId)
      : this.db.leads;

    for (const l of leads) {
      if (l.status === 'CONVERTED') continue;
      const activities = this.db.activities.filter(
        (a) => a.relatedType === 'LEAD' && a.relatedId === l.id,
      );
      if (activities.length === 0) {
        const ageDays = (Date.now() - new Date(l.createdAt).getTime()) / DAY;
        if (ageDays > 7) {
          notifications.push({
            id: `notif-lead-inactive-${l.id}`,
            type: 'INACTIVE_LEAD',
            message: `Prospect sans activité : ${l.firstname} ${l.lastname}`,
            entityId: l.id,
            entityType: 'LEAD',
            url: `/leads/${l.id}`,
            severity: 'medium',
          });
        }
      } else {
        const lastActivity = activities[0];
        const daysSince = (Date.now() - new Date(lastActivity.occurredAt).getTime()) / DAY;
        if (daysSince > 14) {
          notifications.push({
            id: `notif-lead-stale-${l.id}`,
            type: 'INACTIVE_LEAD',
            message: `Prospect inactif depuis ${Math.floor(daysSince)}j : ${l.firstname} ${l.lastname}`,
            entityId: l.id,
            entityType: 'LEAD',
            url: `/leads/${l.id}`,
            severity: 'low',
          });
        }
      }
    }

    const deals = owner
      ? this.db.deals.filter((d) => d.ownerId === owner.ownerId)
      : this.db.deals;

    for (const d of deals) {
      if (d.stage === 'WON' || d.stage === 'LOST') continue;
      if (!d.expectedCloseDate) continue;
      if (d.expectedCloseDate < today) {
        notifications.push({
          id: `notif-deal-stale-${d.id}`,
          type: 'STALE_DEAL',
          message: `Affaire en retard : ${d.title}`,
          entityId: d.id,
          entityType: 'DEAL',
          url: '/deals',
          severity: 'high',
        });
      }
    }

    const severityOrder = { high: 0, medium: 1, low: 2 };
    notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return notifications;
  }

  getCount(user: RequestUser): number {
    return this.getNotifications(user).length;
  }
}