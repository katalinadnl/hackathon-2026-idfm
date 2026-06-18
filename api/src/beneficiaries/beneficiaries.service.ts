import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';
import { Beneficiary } from 'src/generated/prisma/client';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBeneficiaryDto, requestingAccountId: number) {
    const { linkToMe, ...data } = dto;

    try {
      return await this.prisma.beneficiary.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          birthDate: new Date(data.birthDate),
          socialSecurityNumber: data.socialSecurityNumber,
          status: data.status,
          residenceDepartmentId: data.residenceDepartmentId,
          workStudyDepartmentId: data.workStudyDepartmentId,
          accountTitulaireId: linkToMe ? requestingAccountId : undefined,
          accountReferantId: !linkToMe ? requestingAccountId : undefined,
        },
      });
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un bénéficiaire existe déjà avec ce numéro de sécurité sociale.',
        );
      }
      throw error;
    }
  }

  async findByAccount(accountId: number): Promise<Beneficiary[]> {
    const beneficiaries = await this.prisma.beneficiary.findMany({
      where: {
        OR: [
          { accountReferantId: accountId },
          { accountTitulaireId: accountId },
        ],
      },
      include: {},
    });

    return beneficiaries;
  }
}
