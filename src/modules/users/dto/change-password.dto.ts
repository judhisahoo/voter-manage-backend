import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123',
    description: 'Current password of the user',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'NewPassword456',
    description: 'New password to be set',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}


