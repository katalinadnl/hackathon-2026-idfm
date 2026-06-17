import { AccountRole } from 'src/generated/prisma/enums';

export type JwtPayload = {
  id: number;
  email: string;
  role: AccountRole;
};
