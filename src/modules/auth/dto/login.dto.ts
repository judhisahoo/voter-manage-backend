// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'judhisahoo@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'websupport12345',
    minLength: 6,
    description: 'User password (min 6 characters)',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
