import { Injectable, OnModuleInit } from '@nestjs/common';
import { buildSeed, SeedData } from './seed';

@Injectable()
export class MockDatabaseService implements OnModuleInit {
  private data!: SeedData;

  async onModuleInit() {
    await this.reset();
  }

  async reset(): Promise<void> {
    this.data = await buildSeed();
  }

  get users() { return this.data.users; }
  get customers() { return this.data.customers; }
  get leads() { return this.data.leads; }
  get deals() { return this.data.deals; }
  get activities() { return this.data.activities; }
  get tasks() { return this.data.tasks; }
  get notes() { return this.data.notes; }

  snapshot(): SeedData {
    return this.data;
  }
}