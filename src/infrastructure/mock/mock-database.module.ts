import { Global, Module } from '@nestjs/common';
import { MockDatabaseService } from './mock-database.service';

@Global()
@Module({
  providers: [MockDatabaseService],
  exports: [MockDatabaseService],
})
export class MockDatabaseModule {}