import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { TariffsService } from './tariffs.service';

@ApiTags('tariffs')
@Controller('tariffs')
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List transport tariffs synced from the IDFM open data (titres-et-tarifs)',
  })
  @ApiQuery({
    name: 'all',
    required: false,
    description:
      'If "true", return the full synced catalog instead of only the long-duration ("annual") plans.',
  })
  findAll(@Query('all') all?: string) {
    return this.tariffsService.findAll(all !== 'true');
  }
}
