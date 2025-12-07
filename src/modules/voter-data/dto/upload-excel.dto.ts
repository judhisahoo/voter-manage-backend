import { ApiProperty } from '@nestjs/swagger';

export class UploadExcelResponseDto {
  @ApiProperty({ example: true, description: 'Upload success status' })
  success: boolean;

  @ApiProperty({ example: 'Excel file processed successfully', description: 'Response message' })
  message: string;

  @ApiProperty({
    example: {
      totalRows: 100,
      successful: 95,
      failed: 5,
      duplicatesCount: 3
    },
    description: 'Import summary statistics'
  })
  summary: {
    totalRows: number;
    successful: number;
    failed: number;
    duplicatesCount: number;
  };

  @ApiProperty({
    example: {
      duplicates: ['EPIC123456 (already exists)', 'EPIC789012 (already exists)'],
      errors: ['Row 5: Missing required fields - EPIC and Name are mandatory', 'Row 10: Invalid gender value']
    },
    description: 'Detailed error and duplicate information'
  })
  details: {
    duplicates: string[];
    errors: string[];
  };
}