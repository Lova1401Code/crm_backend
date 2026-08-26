import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AuthModule } from '../auth/auth.module';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadsController],
  providers: [LeadsService, ActivityLoggerService],
  exports: [LeadsService],
})
export class LeadsModule {}