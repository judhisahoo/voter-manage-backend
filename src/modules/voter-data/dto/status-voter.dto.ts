// src/modules/voter-data/dto/status-voter.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StatusVoterDto {
  @ApiProperty({
    example: 'ABC1234567',
    description: 'The voter epic number to update the status',
  })
  @IsString()
  @IsNotEmpty()
  epic_no: string;

}