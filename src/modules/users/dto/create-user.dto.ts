import { IsEmail, IsString, MinLength, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({
    example: 'Support User',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'support@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Secret123',
    minLength: 6,
    description: 'Password for the account',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: UserRole.SUPPORT,
    enum: UserRole,
    description: 'Role of the user',
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}