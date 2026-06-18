import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateStatusVerificationDto } from './dto/create-status-verification.dto';

@Injectable()
export class StatusVerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateStatusVerificationDto) {
    return this.prisma.statusVerification.create({
      data: {
        beneficiaryId: dto.beneficiaryId,
        status: dto.status,
        source: dto.source,
        tariffReductionId: dto.tariffReductionId,
        documentUrl: dto.documentUrl,
        verified: dto.verified ?? false,
        expirationDate: dto.expirationDate
          ? new Date(dto.expirationDate)
          : undefined,
      },
    });
  }

  findForBeneficiary(beneficiaryId: number) {
    return this.prisma.statusVerification.findMany({
      where: { beneficiaryId },
      include: { tariffReduction: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
