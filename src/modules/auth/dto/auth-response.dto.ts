import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/schemas/user.schema';

export class AuthUserDto {
  @ApiProperty({ example: '665f1c2b4f1a2b3c4d5e6f7a' })
  id: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: UserRole.ADMIN, enum: UserRole })
  role: UserRole;
}

export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjk5OTk5OTk5fQ.PdnrUO4...',
    description: 'JWT access token',
  })
  access_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}


