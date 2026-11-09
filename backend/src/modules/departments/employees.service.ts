import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaHrisService } from '../../prisma/prisma-hris.service.js';
import { DepartmentsService } from './departments.service.js';

/** Nhân viên đang làm việc trong tháng, theo đơn vị/team tại cuối tháng. */
export type Employee = {
  /** Khoá nối với tài khoản đăng nhập và bảng phân quyền. */
  personSerialKey: string;
  personId: string;
  name: string;
  /** Department_Serial_Key của đơn vị (tại cuối tháng). */
  departmentKey: string;
  /** Mã ngắn của đơn vị (Data_Department.Department_ID). */
  departmentId: string;
  /** Mã team (Data_Department_s); null = chưa có team. */
  teamKey: string | null;
  team: string;
  /** Ngày vào công ty, ISO YYYY-MM-DD. */
  joinDate: string | null;
  position: string;
};

type Row = {
  Department_Key: string;
  Department_ID: string | null;
  Team_Key: string | null;
  Team: string | null;
  Person_Serial_Key: string;
  Person_ID: string;
  Person_Name: string | null;
  Date_Come_In: Date | string | null;
  Position_Name: string | null;
};

const toIsoDate = (v: Date | string | null): string | null => {
  if (!v) return null;
  return v instanceof Date ? v.toISOString().slice(0, 10) : v.slice(0, 10);
};

/**
 * Danh sách nhân viên theo đơn vị từ HRIS (server 0.117). CHỈ ĐỌC — không ghi gì vào server này.
 */
@Injectable()
export class EmployeesService {
  constructor(
    private readonly hris: PrismaHrisService,
    private readonly departments: DepartmentsService,
  ) {}

  /**
   * Nhân viên đang làm việc của mọi đơn vị gốc (HRIS_ROOT_DEPARTMENTS nếu có khai báo), trong một truy vấn.
   * @param within giới hạn sơ bộ trong SQL: thuộc một trong `depts` (Department_Serial_Key)
   *   hoặc một trong `teams` (Data_Department_s); bỏ trống = không giới hạn. Lọc chính xác theo phạm vi
   *   làm ở filterEmployeesByScopes.
   */
  async findAll(within?: {
    depts: string[];
    teams: string[];
  }): Promise<Employee[]> {
    let scopeFilter = Prisma.empty;
    if (within) {
      const parts = [
        ...(within.depts.length > 0
          ? [
              Prisma.sql`DEP.Department_Serial_Key IN (${Prisma.join(within.depts)})`,
            ]
          : []),
        ...(within.teams.length > 0
          ? [
              Prisma.sql`SEC.Department_Serial_Keys IN (${Prisma.join(within.teams)})`,
            ]
          : []),
      ];
      if (parts.length === 0) return [];
      scopeFilter = Prisma.sql`AND (${Prisma.join(parts, ' OR ')})`;
    }

    // Đầu tháng = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
    // "< ngày đầu tháng sau" = DATEADD(DAY, 1, EOMONTH(GETDATE())).
    const rows = await this.hris.$queryRaw<Row[]>`
      SELECT  dd.Department_Serial_Key        AS Department_Key,
              dd.Department_ID,
              dds.Department_Serial_Key        AS Team_Key,
              ISNULL(dds.Department_Name, '')  AS Team,
              P.Person_Serial_Key,
              P.Person_ID,
              P.Person_Name,
              P.Date_Come_In,
              ISNULL(POS.Position_Name, '')    AS Position_Name
      FROM    Data_Person P
              OUTER APPLY (SELECT TOP 1 pd.Position_ID
                           FROM Data_Person_Detail pd
                           WHERE pd.Person_Serial_Key = P.Person_Serial_Key
                           ORDER BY pd.Position_ID) PD
              LEFT JOIN Data_Position dpt ON dpt.Position_ID = PD.Position_ID
              CROSS APPLY (   -- Đơn vị tại cuối tháng
                  SELECT Department_Serial_Key = COALESCE(
                      (SELECT TOP 1 DS.To_Department
                       FROM Data_Decided DS
                       WHERE DS.Person_Serial_Key = P.Person_Serial_Key
                         AND DS.Applied_Date < DATEADD(DAY, 1, EOMONTH(GETDATE()))
                         AND DS.To_Department <> ''
                       ORDER BY DS.Applied_Date DESC),
                      (SELECT TOP 1 DS.From_Department
                       FROM Data_Decided DS
                       WHERE DS.Person_Serial_Key = P.Person_Serial_Key AND DS.From_Department <> ''
                       ORDER BY DS.Applied_Date),
                      P.Department_Serial_Key)
              ) DEP
              CROSS APPLY (   -- Team tại cuối tháng
                  SELECT Department_Serial_Keys = COALESCE(
                      (SELECT TOP 1 DS.To_Department_S
                       FROM Data_Decided DS
                       WHERE DS.Person_Serial_Key = P.Person_Serial_Key
                         AND DS.Applied_Date < DATEADD(DAY, 1, EOMONTH(GETDATE()))
                         AND DS.To_Department_S <> ''
                       ORDER BY DS.Applied_Date DESC),
                      (SELECT TOP 1 DS.From_Department_S
                       FROM Data_Decided DS
                       WHERE DS.Person_Serial_Key = P.Person_Serial_Key AND DS.From_Department_S <> ''
                       ORDER BY DS.Applied_Date),
                      P.Department_Serial_Keys)
              ) SEC
              CROSS APPLY (   -- Chức vụ: theo quyết định D0009/D0016 gần nhất, không có thì theo hồ sơ
                  SELECT Position_Name = COALESCE(
                      (SELECT TOP 1 dp2.Position_Name
                       FROM Data_Decided dd2
                            JOIN Data_Position dp2 ON dp2.Position_ID = dd2.To_Position
                       WHERE dd2.Decided_Serial_Key IN ('D0009', 'D0016')
                         AND dd2.Person_Serial_Key = P.Person_Serial_Key
                         AND dd2.Applied_Date < DATEADD(DAY, 1, EOMONTH(GETDATE()))
                       ORDER BY dd2.Applied_Date DESC),
                      dpt.Position_Name)
              ) POS
              JOIN Data_Department dd         ON dd.Department_Serial_Key = DEP.Department_Serial_Key
              LEFT JOIN Data_Department_s dds ON dds.Department_Serial_Key = SEC.Department_Serial_Keys
                                             AND dds.Group_Department_Serial_Key = dd.Department_Serial_Key
      WHERE   P.Date_Come_In < DATEADD(DAY, 1, EOMONTH(GETDATE()))
              AND (P.Date_Work_End IS NULL
                   OR P.Date_Work_End >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
              AND P.Person_Status = '1'
              ${this.departments.rootFilter(Prisma.raw('DEP.Department_Serial_Key'))}
              ${scopeFilter}
      ORDER BY dd.Department_ID, dds.Department_Name, P.Person_ID`;

    return rows.map((r) => ({
      personSerialKey: r.Person_Serial_Key.trim(),
      personId: r.Person_ID.trim(),
      name: (r.Person_Name ?? '').trim(),
      departmentKey: r.Department_Key.trim(),
      departmentId: (r.Department_ID ?? '').trim(),
      teamKey: r.Team_Key?.trim() || null,
      team: (r.Team ?? '').trim(),
      joinDate: toIsoDate(r.Date_Come_In),
      position: (r.Position_Name ?? '').trim(),
    }));
  }
}
