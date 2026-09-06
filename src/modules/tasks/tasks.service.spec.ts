import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { MockDatabaseService } from '../../infrastructure/mock/mock-database.service';
import { NotFoundError, UnauthorizedError } from '../../common/domain/domain-error';

const admin = { id: 'u-admin-1', role: 'ADMIN' };
const commercial = { id: 'u-comm-1', role: 'COMMERCIAL' };
const commercial2 = { id: 'u-comm-2', role: 'COMMERCIAL' };

describe('TasksService', () => {
  let service: TasksService;
  let db: MockDatabaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TasksService, MockDatabaseService],
    }).compile();
    service = module.get(TasksService);
    db = module.get(MockDatabaseService);
    await db.reset();
  });

  const createTask = async (ownerId: string) => {
    return service.create({ id: ownerId, role: 'ADMIN' } as any, {
      title: 'Test Task',
      description: 'Do something',
      dueDate: '2025-12-31',
      priority: 'HIGH',
      status: 'OPEN',
    } as any);
  };

  describe('findMany', () => {
    it('returns paginated tasks', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 10 });
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('filters by status', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { status: 'OPEN' } });
      expect(result.items.every((t) => t.status === 'OPEN')).toBe(true);
    });

    it('filters by priority', async () => {
      const result = await service.findMany(admin, { page: 1, limit: 100, filters: { priority: 'HIGH' } });
      expect(result.items.every((t) => t.priority === 'HIGH')).toBe(true);
    });

    it('filters by ownerId for commercial', async () => {
      const result = await service.findMany(commercial, { page: 1, limit: 100 });
      expect(result.items.every((t) => t.ownerId === commercial.id)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('returns task by id', async () => {
      const task = await createTask('u-comm-1');
      const found = await service.findOne(admin, task.id);
      expect(found.id).toBe(task.id);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findOne(admin, 'unknown')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('creates a task', async () => {
      const task = await createTask('u-comm-1');
      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.completedAt).toBeNull();
    });
  });

  describe('toggle', () => {
    it('toggles OPEN to DONE', async () => {
      const task = await createTask('u-comm-1');
      const toggled = await service.toggle(admin, task.id);
      expect(toggled.status).toBe('DONE');
      expect(toggled.completedAt).not.toBeNull();
    });

    it('toggles DONE back to OPEN', async () => {
      const task = await createTask('u-comm-1');
      await service.toggle(admin, task.id);
      const toggledBack = await service.toggle(admin, task.id);
      expect(toggledBack.status).toBe('OPEN');
      expect(toggledBack.completedAt).toBeNull();
    });

    it('throws UnauthorizedError when commercial toggles other owner', async () => {
      const task = await createTask('u-comm-2');
      await expect(service.toggle(commercial, task.id)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('update', () => {
    it('updates task fields', async () => {
      const task = await createTask('u-comm-1');
      const updated = await service.update(admin, task.id, { title: 'Updated' } as any);
      expect(updated.title).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('deletes a task', async () => {
      const task = await createTask('u-comm-1');
      await service.remove(admin, task.id);
      await expect(service.findOne(admin, task.id)).rejects.toThrow(NotFoundError);
    });
  });
});