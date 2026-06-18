import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';

@Controller('bank-info')
export class BankInfoController {
  constructor(private readonly bankInfoService: BankInfoService) {}

  @Post()
  create(@Body() createBankInfoDto: CreateBankInfoDto) {
    return this.bankInfoService.create(createBankInfoDto);
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

  @Delete(':id')
  remove(@Param('id') id: string, @GetMe() user: JwtPayload) {
    return this.bankInfoService.remove(+id, user.id);
  }
}
