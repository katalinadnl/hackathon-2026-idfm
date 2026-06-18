import {
  Controller,
  Headers,
  HttpCode,
  Post,
  RawBody,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { StripeWebhookService } from './stripe-webhook.service';

@ApiExcludeController()
@Controller('billing/stripe')
export class StripeWebhookController {
  constructor(private readonly webhooks: StripeWebhookService) {}

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.webhooks.handleEvent(rawBody, signature);
    return { received: true };
  }
}