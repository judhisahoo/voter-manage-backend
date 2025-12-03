// src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Put('/profile')
  @ApiOperation({ summary: 'Update own profile' })
  async updateProfile(@Request() req, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateDto);
  }

  @Put('/change-password')
  @ApiOperation({ summary: 'Change own password' })
  async changePassword(
    @Request() req,
    @Body() body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a user (admin only)' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.update(id, updateDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user status (admin only)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.usersService.updateStatus(id, body.status as any);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
