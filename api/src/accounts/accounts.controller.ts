import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetMe } from 'src/auth/decorators/get-me.decorator';
import type { JwtPayload } from 'src/auth/types';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get('search')
  searchAccounts(@Query('email') email: string, @GetMe() user: JwtPayload) {
    return this.accountsService.searchAccountsByEmail(email ?? '', user);
  }
}
