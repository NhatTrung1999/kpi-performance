import { Injectable } from '@nestjs/common';
import { PrismaAuthService } from '../../prisma/prisma-auth.service.js';

export type AuthUser = {
  userId: string;
  accountId: string;
  fullName: string | null;
  password: Buffer | null;
  locked: boolean;
  /** Khoá nối sang nhân viên HRIS (0.117) và bảng phân quyền; null nếu tài khoản không gắn nhân viên. */
  personSerialKey: string | null;
};

@Injectable()
export class UsersService {
  constructor(private readonly prismaAuth: PrismaAuthService) {}

  async findByAccountId(accountId: string): Promise<AuthUser | undefined> {
    const rows = await this.prismaAuth.$queryRaw<
      {
        userId: string;
        AccountID: string;
        fullName: string | null;
        password: Buffer | Uint8Array | null;
        lock: boolean | null;
        Person_Serial_Key: string | null;
      }[]
    >`SELECT TOP 1 userId, AccountID, fullName, password, [lock] AS lock, Person_Serial_Key
      FROM users WHERE AccountID = ${accountId}`;

    const row = rows[0];
    if (!row) return undefined;
    return {
      userId: row.userId,
      accountId: row.AccountID,
      fullName: row.fullName,
      password: row.password ? Buffer.from(row.password) : null,
      locked: !!row.lock,
      personSerialKey: row.Person_Serial_Key?.trim() || null,
    };
  }
}
