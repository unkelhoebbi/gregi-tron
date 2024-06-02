import { Module } from '@nestjs/common';
import { TemperatureService } from './temperature.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TemperatureService],
  exports: [TemperatureService],
})
export class DataCollectorModule {}
