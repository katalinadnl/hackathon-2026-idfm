import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';

@Injectable()
export class BankInfoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBankInfoDto: CreateBankInfoDto) {
    return this.prisma.bankInfo.create({ data: createBankInfoDto });
  }

  async findOne(id: number, requesterId: number) {
    const bankInfo = await this.prisma.bankInfo.findUnique({ where: { id } });

    if (!bankInfo) {
      throw new NotFoundException(`BankInfo ${id} introuvable`);
    }
    if (bankInfo.accountId !== requesterId) {
      throw new ForbiddenException();
    }

    return bankInfo;
  }

  async update(
    id: number,
    updateBankInfoDto: UpdateBankInfoDto,
    requesterId: number,
  ) {
    await this.ensureExists(id);

    const bankInfo = await this.prisma.bankInfo.update({
      where: { id },
      data: updateBankInfoDto,
    });
    if (bankInfo.accountId !== requesterId) {
      throw new ForbiddenException();
    }
    return bankInfo;
  }

  async remove(id: number, requesterId: number) {
    await this.ensureExists(id);

    const bankInfo = await this.prisma.bankInfo.delete({ where: { id } });
    if (bankInfo.accountId !== requesterId) {
      throw new ForbiddenException();
    }
    return bankInfo;
  }

  private async ensureExists(id: number) {
    const exists = await this.prisma.bankInfo.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException(`BankInfo ${id} introuvable`);
    }
  }
}
