import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../schemas/user.schema';

export class UserDto {
  @ApiProperty({
    example: '665f1c2b4f1a2b3c4d5e6f7a',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: UserRole.ADMIN, enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: UserStatus.ACTIVE, enum: UserStatus })
  status: UserStatus;

  @ApiProperty({
    example: '2025-01-01T10:00:00.000Z',
    nullable: true,
    description: 'Last login date/time',
  })
  lastLogin?: Date;

  @ApiProperty({
    example: false,
    description: 'Whether the user has verified their email',
  })
  isEmailVerified: boolean;
}


