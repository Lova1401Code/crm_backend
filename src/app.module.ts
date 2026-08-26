import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LeadsModule } from './modules/leads/leads.module';
import { DealsModule } from './modules/deals/deals.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotesModule } from './modules/notes/notes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CustomersModule,
    LeadsModule,
    DealsModule,
    ActivitiesModule,
    TasksModule,
    NotesModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}