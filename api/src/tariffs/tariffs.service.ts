import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TariffsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(onlyAnnual = true) {
    return this.prisma.transportProduct.findMany({
      where: onlyAnnual ? { isAnnualPlan: true } : undefined,
      orderBy: { priceCents: 'asc' },
    });
  }
}
