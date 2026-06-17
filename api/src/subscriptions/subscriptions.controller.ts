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
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ReportLostOrStolenDto } from './dto/report-lost-or-stolen.dto';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';
import { LinkReferrerDto } from './dto/link-referrer.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(+id, updateSubscriptionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(+id);
  }

  @Post(':id/report-lost-or-stolen')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  reportLostOrStolen(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReportLostOrStolenDto,
    @GetMe() user: JwtPayload,
  ) {
    const requesterAccountId = user.id;
    return this.subscriptionsService.reportLostOrStolen(
      id,
      requesterAccountId,
      dto,
    );
  }
  @Post(':id/unlink-referrer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  unlinkReferrer(
    @Param('id', ParseIntPipe) id: number,
    @GetMe() user: JwtPayload,
  ) {
    const requesterAccountId = user.id;
    return this.subscriptionsService.unlinkReferrer(id, requesterAccountId);
  }

  @Post(':id/assign-referrer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  linkReferrer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: LinkReferrerDto,
    @GetMe() user: JwtPayload,
  ) {
    const requesterAccountId = user.id;
    return this.subscriptionsService.assignReferrer(
      id,
      requesterAccountId,
      body.referrerId,
    );
  }
}
