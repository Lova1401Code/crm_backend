import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadScoringService } from './lead-scoring.service';
import { AuthModule } from '../auth/auth.module';
import { ActivityLoggerService } from '../../common/services/activity-logger.service';

@Module({
  imports: [AuthModule],
  controllers: [LeadsController],
  providers: [LeadsService, LeadScoringService, ActivityLoggerService],
  exports: [LeadsService, LeadScoringService],
})
export class LeadsModule {}