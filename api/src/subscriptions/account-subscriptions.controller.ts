import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SubscriptionsService } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('accounts')
export class AccountSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions for an account with roles' })
  findByAccount(@Param('id', ParseIntPipe) id: number) {
    return this.subscriptionsService.findByAccount(id);
  }
}
