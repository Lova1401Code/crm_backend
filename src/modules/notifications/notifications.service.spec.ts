import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationsService, MockDatabaseService],
    }).compile();
    service = module.get(NotificationsService);
    const db = module.get(MockDatabaseService);
    await db.reset();
  });

  it('returns an array of notifications', () => {
    const notifications = service.getNotifications(admin);
    expect(Array.isArray(notifications)).toBe(true);
  });

  it('each notification has required fields', () => {
    const notifications = service.getNotifications(admin);
    notifications.forEach((n) => {
      expect(n).toHaveProperty('id');
      expect(n).toHaveProperty('type');
      expect(n).toHaveProperty('message');
      expect(n).toHaveProperty('entityId');
      expect(n).toHaveProperty('entityType');
      expect(n).toHaveProperty('url');
      expect(n).toHaveProperty('severity');
    });
  });

  it('detects overdue or due today tasks', () => {
    const notifications = service.getNotifications(admin);
    const taskNotifs = notifications.filter((n) => n.type === 'OVERDUE_TASK' || n.type === 'DUE_TODAY_TASK');
    expect(taskNotifs.length).toBeGreaterThan(0);
  });

  it('detects inactive or stale leads', () => {
    const notifications = service.getNotifications(admin);
    const inactive = notifications.filter((n) => n.type === 'INACTIVE_LEAD');
    expect(inactive.length).toBeGreaterThan(0);
  });

  it('sorts by severity (high first)', () => {
    const notifications = service.getNotifications(admin);
    const severityOrder = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < notifications.length; i++) {
      expect(severityOrder[notifications[i].severity])
        .toBeGreaterThanOrEqual(severityOrder[notifications[i - 1].severity]);
    }
  });

  it('count matches notifications length', () => {
    const count = service.getCount(admin);
    const notifications = service.getNotifications(admin);
    expect(count).toBe(notifications.length);
  });

  it('restricts to own data for commercial', () => {
    const adminNotifs = service.getNotifications(admin);
    const commNotifs = service.getNotifications(commercial);
    expect(commNotifs.length).toBeLessThanOrEqual(adminNotifs.length);
  });
});