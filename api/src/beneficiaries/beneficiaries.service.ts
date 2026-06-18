import { ConflictException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBeneficiaryDto } from './dto/create-beneficiary.dto';

@Injectable()
export class BeneficiariesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBeneficiaryDto, requestingAccountId: number) {
    const { linkToMe, ...data } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (linkToMe) {
        const account = await tx.account.findUnique({
          where: { id: requestingAccountId },
          select: { beneficiaryId: true },
        });
        if (account?.beneficiaryId) {
          throw new ConflictException(
            'Ce compte est déjà associé à un bénéficiaire.',
          );
        }
      }

      const beneficiary = await tx.beneficiary
        .create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            birthDate: new Date(data.birthDate),
            socialSecurityNumber: data.socialSecurityNumber,
            status: data.status,
            residenceDepartmentId: data.residenceDepartmentId,
            workStudyDepartmentId: data.workStudyDepartmentId,
          },
        })
        .catch((error: unknown) => {
          if (
            error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 'P2002'
          ) {
            throw new ConflictException(
              'Un bénéficiaire existe déjà avec cet email ou ce numéro de sécurité sociale.',
            );
          }
          throw error;
        });

      if (linkToMe) {
        await tx.account.update({
          where: { id: requestingAccountId },
          data: { beneficiaryId: beneficiary.id },
        });
      }

      return beneficiary;
    });
  }
}