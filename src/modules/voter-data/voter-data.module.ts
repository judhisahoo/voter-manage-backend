import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { VoterDataService } from './voter-data.service';
import { VoterDataController } from './voter-data.controller';
import { VoterData, VoterDataSchema } from './schemas/voter-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VoterData.name, schema: VoterDataSchema },
    ]),
    ConfigModule,
  ],
  providers: [VoterDataService],
  controllers: [VoterDataController],
  exports: [VoterDataService],
})
export class VoterDataModule {}