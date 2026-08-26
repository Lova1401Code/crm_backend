import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from './deals.controller';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';

@Module({
  imports: [AuthModule, CustomersModule],
  controllers: [DealsController],
  providers: [DealsService, ActivityLoggerService],
  exports: [DealsService],
})
export class DealsModule {}