import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaHrisService } from '../../prisma/prisma-hris.service.js';

/** Team (Data_Department_s) trong một đơn vị. id = null: nhóm nhân viên chưa được xếp team. */
export type TeamNode = {
  id: string | null;
  name: string | null;
  employees: number;
};

/** Đơn vị (Data_Department) → các team con; employees = tổng nhân viên đang làm việc. */
export type DepartmentNode = {
  id: string;
  name: string;
  employees: number;
  children: TeamNode[];
};

type Row = {
  Department_Serial_Key: string;
  Department_Name: string | null;
  Department_Serial_Key_s: string | null;
  Department_Name_s: string | null;
  Total_Employee: number | bigint | null;
};

/**
 * Đọc cây đơn vị + số nhân viên từ HRIS (server 0.117, DATABASE_HRIS_URL). CHỈ ĐỌC — không ghi gì vào server này.
 * Chỉ lấy các đơn vị gốc khai báo trong HRIS_ROOT_DEPARTMENTS (Department_Serial_Key, cách nhau dấu phẩy);
 * để trống / không khai báo = lấy mọi đơn vị.
 */
@Injectable()
export class DepartmentsService {
  private readonly rootKeys: string[];

  constructor(
    private readonly hris: PrismaHrisService,
    config: ConfigService,
  ) {
    this.rootKeys = String(config.get('HRIS_ROOT_DEPARTMENTS') ?? '')
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  /** Đơn vị có được phép xem không (nằm trong HRIS_ROOT_DEPARTMENTS; không khai báo = mọi đơn vị). */
  isAllowedRoot(deptKey: string): boolean {
    return this.rootKeys.length === 0 || this.rootKeys.includes(deptKey);
  }

  /** Điều kiện lọc đơn vị gốc cho câu SQL; rỗng khi không giới hạn. */
  rootFilter(column: Prisma.Sql): Prisma.Sql {
    return this.rootKeys.length > 0
      ? Prisma.sql`AND ${column} IN (${Prisma.join(this.rootKeys)})`
      : Prisma.empty;
  }

  /** Mã các team đang hoạt động (NoUse_Date > hôm nay) của các đơn vị, một truy vấn: mã đơn vị → mã team. */
  async activeTeamsByDept(
    deptKeys: string[],
  ): Promise<Map<string, Set<string>>> {
    const out = new Map(deptKeys.map((k) => [k, new Set<string>()]));
    if (deptKeys.length === 0) return out;
    const rows = await this.hris.$queryRaw<
      { Department_Serial_Key: string; Group_Department_Serial_Key: string }[]
    >`
      SELECT Department_Serial_Key, Group_Department_Serial_Key
      FROM   Data_Department_s
      WHERE  Group_Department_Serial_Key IN (${Prisma.join(deptKeys)})
             AND NoUse_Date > GETDATE()`;
    for (const r of rows) {
      out
        .get(r.Group_Department_Serial_Key.trim())
        ?.add(r.Department_Serial_Key.trim());
    }
    return out;
  }

  async findTree(): Promise<DepartmentNode[]> {
    // Số nhân viên đang làm việc trong tháng hiện tại, theo đơn vị/team tại cuối tháng
    // (lấy từ quyết định điều chuyển Data_Decided gần nhất, không có thì dùng Data_Person).
    // Đầu tháng = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1); cuối tháng = EOMONTH(GETDATE()).
    const rows = await this.hris.$queryRaw<Row[]>`
      WITH DeptList AS (
               -- Danh sách đơn vị + team (kể cả team chưa có nhân viên), bỏ team đã ngưng dùng
               SELECT dd.Department_Serial_Key
                     ,dd.Department_Name
                     ,ISNULL(ds.Department_Serial_Key, '') AS Team_Key
                     ,ds.Department_Name AS Team_Name
               FROM   Data_Department dd
                      LEFT JOIN Data_Department_s ds
                           ON  ds.Group_Department_Serial_Key = dd.Department_Serial_Key
                               AND ds.NoUse_Date > GETDATE()
               WHERE  1 = 1
                      ${this.rootFilter(Prisma.raw('dd.Department_Serial_Key'))}
           ),
           EmpData AS (
               -- Nhân viên đang làm việc, đơn vị/team tại cuối tháng
               SELECT dd.Department_Serial_Key
                     ,dd.Department_Name
                     ,ISNULL(dds.Department_Serial_Key, '') AS Team_Key
                     ,P.Person_ID
               FROM   Data_Person P
                      CROSS APPLY (
                          SELECT Department_Serial_Key = COALESCE(
                                     (SELECT TOP 1 NULLIF(To_Department, '')
                                      FROM   Data_Decided DS
                                      WHERE  DS.Person_Serial_Key = P.Person_Serial_Key
                                             AND Applied_Date <= EOMONTH(GETDATE())
                                             AND To_Department <> ''
                                      ORDER BY Applied_Date DESC)
                                    ,(SELECT TOP 1 NULLIF(From_Department, '')
                                      FROM   Data_Decided DS
                                      WHERE  DS.Person_Serial_Key = P.Person_Serial_Key
                                             AND From_Department <> ''
                                      ORDER BY Applied_Date)
                                    ,P.Department_Serial_Key)
                      ) DEP
                      CROSS APPLY (
                          SELECT Department_Serial_Keys = COALESCE(
                                     (SELECT TOP 1 NULLIF(To_Department_S, '')
                                      FROM   Data_Decided DS
                                      WHERE  DS.Person_Serial_Key = P.Person_Serial_Key
                                             AND Applied_Date <= EOMONTH(GETDATE())
                                             AND To_Department_S <> ''
                                      ORDER BY Applied_Date DESC)
                                    ,(SELECT TOP 1 NULLIF(From_Department_S, '')
                                      FROM   Data_Decided DS
                                      WHERE  DS.Person_Serial_Key = P.Person_Serial_Key
                                             AND From_Department_S <> ''
                                      ORDER BY Applied_Date)
                                    ,P.Department_Serial_Keys)
                      ) SEC
                      JOIN Data_Department dd
                           ON  dd.Department_Serial_Key = DEP.Department_Serial_Key
                      LEFT JOIN Data_Department_s dds
                           ON  dds.Department_Serial_Key = SEC.Department_Serial_Keys
                               AND dds.Group_Department_Serial_Key = dd.Department_Serial_Key
                               AND dds.NoUse_Date > GETDATE()
               WHERE  P.Date_Come_In <= EOMONTH(GETDATE())
                      AND (P.Date_Work_End IS NULL
                           OR P.Date_Work_End >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
                      AND P.Person_Status = '1'
                      ${this.rootFilter(Prisma.raw('DEP.Department_Serial_Key'))}
           ),
           EmpCount AS (
               SELECT Department_Serial_Key
                     ,Department_Name
                     ,Team_Key
                     ,COUNT(DISTINCT Person_ID) AS Total_Employee
               FROM   EmpData
               GROUP BY Department_Serial_Key, Department_Name, Team_Key
           )
      SELECT COALESCE(L.Department_Serial_Key, C.Department_Serial_Key) AS Department_Serial_Key
            ,COALESCE(L.Department_Name, C.Department_Name) AS Department_Name
            ,NULLIF(COALESCE(L.Team_Key, C.Team_Key), '') AS Department_Serial_Key_s
            ,L.Team_Name AS Department_Name_s
            ,ISNULL(C.Total_Employee, 0) AS Total_Employee
      FROM   DeptList L
             FULL JOIN EmpCount C
                  ON  C.Department_Serial_Key = L.Department_Serial_Key
                      AND C.Team_Key = L.Team_Key
      ORDER BY Department_Name, Department_Name_s`;

    return toTree(rows);
  }
}

/**
 * Gom các dòng (đơn vị, team, số NV) thành cây, giữ thứ tự ORDER BY.
 * - Dòng không có mã team (null) = nhân viên chưa có team; đưa xuống cuối danh sách team.
 * - Đơn vị không có team nào: chỉ có dòng null đó → không tạo team con, số NV gắn vào đơn vị.
 */
export function toTree(rows: Row[]): DepartmentNode[] {
  const byId = new Map<string, DepartmentNode>();
  for (const r of rows) {
    const id = r.Department_Serial_Key.trim();
    let node = byId.get(id);
    if (!node) {
      node = {
        id,
        name: (r.Department_Name ?? id).trim(),
        employees: 0,
        children: [],
      };
      byId.set(id, node);
    }
    const teamId = r.Department_Serial_Key_s?.trim() || null;
    node.children.push({
      id: teamId,
      name: teamId ? (r.Department_Name_s ?? teamId).trim() : null,
      employees: Number(r.Total_Employee ?? 0),
    });
  }

  for (const node of byId.values()) {
    node.employees = node.children.reduce((a, c) => a + c.employees, 0);
    const teams = node.children.filter((c) => c.id !== null);
    const noTeam = node.children.filter((c) => c.id === null);
    node.children =
      teams.length === 0
        ? []
        : [...teams, ...noTeam.filter((c) => c.employees > 0)];
  }
  return [...byId.values()];
}
