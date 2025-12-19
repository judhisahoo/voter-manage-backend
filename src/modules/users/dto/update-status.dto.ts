import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserStatus } from '../schemas/user.schema';

export class UpdateStatusDto {
  @ApiProperty({
    example: UserStatus.ACTIVE,
    enum: UserStatus,
    description: 'New status for the user',
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;
}
