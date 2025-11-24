// src/modules/voter-data/voter-data.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { VoterDataService } from './voter-data.service';
import { SearchVoterDto } from './dto/search-voter.dto';

@Controller('voter-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VoterDataController {
  constructor(private voterDataService: VoterDataService) {}

  @Post('search')
  async search(@Body() searchDto: SearchVoterDto) {
    const epicNumbers = searchDto.epicNumbers.split(',').map((e) => e.trim());
    return this.voterDataService.searchMultiple(epicNumbers);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.voterDataService.findAll({}, query);
  }

  @Post('disable/:epicNo')
  @Roles(UserRole.ADMIN)
  async disable(@Param('epicNo') epicNo: string, @Request() req) {
    return this.voterDataService.disable(epicNo, req.user.userId);
  }

  @Delete(':epicNo')
  @Roles(UserRole.ADMIN)
  async delete(@Param('epicNo') epicNo: string) {
    return this.voterDataService.delete(epicNo);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.voterDataService.findById(id);
  }

  @Get('details/:epicNo')
  async details(@Param('epicNo') epicNo: string) {
    return this.voterDataService.searchSingle(epicNo);
  }
}
