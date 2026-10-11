import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MockDataModule } from './mock-data/mock-data.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DocumentsModule } from './modules/documents/documents.module.js';
import { FlightHoursModule } from './modules/flight-hours/flight-hours.module.js';
import { PilotModule } from './modules/pilot/pilot.module.js';
import { SchedulesModule } from './modules/schedules/schedules.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MockDataModule,
    AuthModule,
    PilotModule,
    DocumentsModule,
    SchedulesModule,
    FlightHoursModule,
  ],
})
export class AppModule {}