import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Updated Name',
    description: 'Updated name of the user',
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    example: 'new.email@example.com',
    description: 'Updated email address',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: 'Updated role of the user',
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}