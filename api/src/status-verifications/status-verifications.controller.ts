import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateStatusVerificationDto } from './dto/create-status-verification.dto';
import { StatusVerificationsService } from './status-verifications.service';

@ApiTags('status-verifications')
@Controller('status-verifications')
export class StatusVerificationsController {
  constructor(
    private readonly statusVerificationsService: StatusVerificationsService,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Record a status/reduction eligibility claim (document, declarative, or API-sourced)',
  })
  create(@Body() dto: CreateStatusVerificationDto) {
    return this.statusVerificationsService.create(dto);
  }

  @Get('beneficiary/:beneficiaryId')
  findForBeneficiary(@Param('beneficiaryId') beneficiaryId: string) {
    return this.statusVerificationsService.findForBeneficiary(+beneficiaryId);
  }
}