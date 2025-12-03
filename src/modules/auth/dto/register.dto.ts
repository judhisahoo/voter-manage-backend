// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/schemas/user.schema';

export class RegisterDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Secret123',
    minLength: 6,
    description: 'Password for the account',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: UserRole.ADMIN,
    enum: UserRole,
    description: 'Role of the user',
  })
  @IsEnum(UserRole)
  role: UserRole;
}
