import { SetMetadata } from '@nestjs/common';
import { AccountRole } from 'src/generated/prisma/enums';

export const Roles = (...roles: AccountRole[]) => SetMetadata('roles', roles);
