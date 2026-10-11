import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MockDataModule } from './mock-data/mock-data.module.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MockDataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
