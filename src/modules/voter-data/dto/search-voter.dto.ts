// src/modules/voter-data/dto/search-voter.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class SearchVoterDto {
  @IsString()
  @IsNotEmpty()
  epicNumbers: string; // Comma-separated EPIC numbers
}