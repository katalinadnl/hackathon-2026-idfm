import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

export interface NetworkStatus {
  status: 'normal' | 'disrupted' | 'major_disruption';
  message: string;
  messageEn: string;
  updatedAt: string;
}

@ApiTags('transport')
@Controller('transport')
export class TransportController {
  @Get('status')
  @ApiOperation({
    summary: 'Get current network status (ready for PRIM API integration)',
  })
  getStatus(): NetworkStatus {
    return {
      status: 'normal',
      message: "Trafic normal sur l'ensemble du réseau.",
      messageEn: 'Normal service on all lines.',
      updatedAt: new Date().toISOString(),
    };
  }
}
