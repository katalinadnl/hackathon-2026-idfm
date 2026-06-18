import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('bank-infos')
export class BankInfoController {
  constructor(private readonly bankInfoService: BankInfoService) {}

  @Post()
  create(@Body() createBankInfoDto: CreateBankInfoDto) {
    return this.bankInfoService.create(createBankInfoDto);
  }

  @Get()
  findAll(@GetMe() user: JwtPayload) {
    return this.bankInfoService.findAll(user.id);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @GetMe() user: JwtPayload) {
    return this.bankInfoService.findOne(+id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBankInfoDto: UpdateBankInfoDto,
    @GetMe() user: JwtPayload,
  ) {
    return this.bankInfoService.update(+id, updateBankInfoDto, user.id);
  }

  @Get(':id/usage')
  getUsage(@Param('id', ParseIntPipe) id: number, @GetMe() user: JwtPayload) {
    return this.bankInfoService.getUsage(id, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { replacementBankInfoId?: number },
    @GetMe() user: JwtPayload,
  ) {
    return this.bankInfoService.remove(id, user.id, dto?.replacementBankInfoId);
  }
}
