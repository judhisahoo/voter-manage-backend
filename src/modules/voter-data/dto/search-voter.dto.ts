// src/modules/voter-data/dto/search-voter.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchVoterDto {
  @ApiProperty({
    example: 'ABC1234567, XYZ9876543',
    description: 'Comma-separated list of EPIC numbers to search for',
  })
  @IsString()
  @IsNotEmpty()
  epicNumbers: string; // Comma-separated EPIC numbers
}