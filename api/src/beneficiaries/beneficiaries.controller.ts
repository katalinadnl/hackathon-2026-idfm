import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetMe } from 'src/auth/decorators/get-me.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { JwtPayload } from 'src/auth/types';
import { BeneficiariesService } from './beneficiaries.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';

@ApiTags('beneficiaries')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('beneficiaries')
export class BeneficiariesController {
  constructor(private readonly beneficiariesService: BeneficiariesService) {}

  @Post()
  @ApiOperation({
    summary:
      'Create a beneficiary, optionally linking it to the connected account',
  })
  create(@GetMe() user: JwtPayload, @Body() dto: CreateBeneficiaryDto) {
    return this.beneficiariesService.create(dto, user.id);
  }

  @Get()
  findAll(@GetMe() user: JwtPayload) {
    return this.beneficiariesService.findByAccount(user.id);
  }
}
