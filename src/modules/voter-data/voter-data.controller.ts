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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody,ApiOperation,ApiParam,ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { VoterDataService } from './voter-data.service';
import { SearchVoterDto } from './dto/search-voter.dto';
import { UploadExcelResponseDto } from './dto/upload-excel.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { StatusVoterDto } from './dto/status-voter.dto';

@ApiTags('voter-data')
@ApiBearerAuth('access-token')
@Controller('voter-data')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VoterDataController {
  constructor(private voterDataService: VoterDataService) {}

  @HttpCode(HttpStatus.OK)
  @Post('search')
  async search(@Body() searchDto: SearchVoterDto) {
    const epicNumbers = searchDto.epicNumbers.split(',').map((e) => e.trim());
    return this.voterDataService.searchMultiple(epicNumbers);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async findAll(@Query() query: any) {
    return this.voterDataService.findAll({}, query);
  }

  @HttpCode(HttpStatus.OK)
  @Post('disable/:epicNo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Disable voter data by EPIC number (admin only)' })

  async disable(@Body() statusVoterDto: StatusVoterDto, @Request() req: any) {
    return this.voterDataService.disable(statusVoterDto, req.user.userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('enable/:epicNo')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Enable voter data by EPIC number (admin only)' })
  /*async enable(@Param('epicNo') epicNo: string, @Request() req) {
    return this.voterDataService.enable(epicNo, req.user.userId);
  }*/
 async enable(@Body() statusVoterDto: StatusVoterDto, @Request() req: any) {
    return this.voterDataService.enable(statusVoterDto,req.user.userId);
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

  @Post('upload-excel')
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File): Promise<UploadExcelResponseDto> {
    return this.voterDataService.handleFileUpload(file);
  }
  
}
