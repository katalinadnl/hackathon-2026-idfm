import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBankInfoDto } from './dto/create-bank-info.dto';
import { UpdateBankInfoDto } from './dto/update-bank-info.dto';

@Injectable()
export class BankInfoService {
  constructor(private readonly prisma: PrismaService) {}

  create(createBankInfoDto: CreateBankInfoDto) {
    return this.prisma.bankInfo.create({ data: createBankInfoDto });
  }

  async findOne(id: number) {
    const bankInfo = await this.prisma.bankInfo.findUnique({ where: { id } });

    if (!bankInfo) {
      throw new NotFoundException(`BankInfo ${id} introuvable`);
    }

    return bankInfo;
  }

  async update(id: number, updateBankInfoDto: UpdateBankInfoDto) {
    await this.ensureExists(id);

    return this.prisma.bankInfo.update({
      where: { id },
      data: updateBankInfoDto,
    });
  }

  async remove(id: number) {
    await this.ensureExists(id);

    return this.prisma.bankInfo.delete({ where: { id } });
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
