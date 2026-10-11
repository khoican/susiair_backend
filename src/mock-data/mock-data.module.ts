import { Global, Module } from '@nestjs/common';
import { MockDataService } from './mock-data.service.js';

@Global()
@Module({
  providers: [MockDataService],
  exports: [MockDataService],
})
export class MockDataModule {}
