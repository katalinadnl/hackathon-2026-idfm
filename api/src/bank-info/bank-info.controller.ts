import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BankInfoService } from './bank-info.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';

@Controller('bank-info')
export class BankInfoController {
  constructor(private readonly bankInfoService: BankInfoService) {}

  @Post()
  create(@Body() createBankInfoDto: CreateBankInfoDto) {
    return this.bankInfoService.create(createBankInfoDto);
  }

  @Get()
  findAll() {
    return this.bankInfoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankInfoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBankInfoDto: UpdateBankInfoDto) {
    return this.bankInfoService.update(+id, updateBankInfoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bankInfoService.remove(+id);
  }
}
