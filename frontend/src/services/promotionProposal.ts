/**
 * Dữ liệu màn Thăng chức & lương — hiện là DỮ LIỆU MẪU, chưa gọi API.
 * Khi backend có endpoint, thay thân các hàm bằng `http.*` (lib/axios.ts) và giữ nguyên kiểu:
 *   getPromotionProposal       → GET  /promotion-proposals/current?group=…
 *   savePromotionDraft         → PUT  /promotion-proposals/current/groups/:id/draft     (CQ, HR, KT, BLĐ — phần của mình)
 *   submitPromotionProposal    → POST /promotion-proposals/current/groups/:id/submit    (CQ)
 *   approvePromotionProposal   → POST /promotion-proposals/current/groups/:id/approve   (BLĐ)
 *   returnPromotionProposal    → POST /promotion-proposals/current/groups/:id/return    (BLĐ, kèm lý do)
 *   uploadOrgChart / removeOrgChart → PUT/DELETE /promotion-proposals/current/groups/:id/org-charts/:slot (CQ)
 * Bản mẫu lưu trạng thái/nháp vào localStorage (dùng chung mọi tài khoản trên máy); file sơ đồ tổ chức chỉ giữ trong bộ nhớ.
 * Ngày lưu ISO `YYYY-MM-DD`; tên bộ phận, họ tên, chức vụ, bình bầu là dữ liệu hệ thống, hiển thị nguyên văn.
 */
import {
  canEdit,
  canView,
  EFFECTIVE_DATE,
  hasPromotion,
  hasRaise,
  ORG_CHART,
  POSITION_CODES,
  type BoardType,
  type Division,
  type GroupStatus,
  type OrgChartSlot,
  type PromotionField,
  type ProposalType,
} from '@/config/promotion-proposal';
import type { AppRole } from '@/lib/session';

export type ContractType = 'permanent' | 'fixed';
/** Tình trạng nhân viên (hệ thống nhân sự). `resigned` không bao giờ hiển thị. */
export type EmployeeStatus = 'active' | 'maternity' | 'sickLeave' | 'contractSuspended' | 'resigned';

/** Một lần điều chỉnh lương (chỉ tính lương ký HĐ, không tính PSH, BB…). */
export type SalaryAdjustment = { date: string; amount: number };

/** Nhóm lương T–AH: chỉ BLĐ, Kế toán, Nhân sự xem (xem GROUP_VIEW). Không có trong dữ liệu trả về cho vai trò khác. */
export type SalaryInfo = {
  /** T + U: các lần điều chỉnh lương. */
  history: SalaryAdjustment[];
  /** W–Z: lương HĐ, tiền bình bầu, tiền chuyên cần, phí sinh hoạt hiện tại. */
  contract: number;
  rating: number;
  attendance: number;
  living: number;
  /** AC–AF: Kế toán tạm tính; `null` = chưa nhập. */
  newContract: number | null;
  newRating: number | null;
  newAttendance: number | null;
  newLiving: number | null;
};

/** Nhóm BLĐ AJ–AN. `type: null` = chưa chỉnh, theo đề xuất của CQ. */
export type BoardDecision = { type: BoardType | null; title: string | null; amount: number | null; reason: string };

export type PromotionRow = {
  /** Khóa nhân viên (Person_Serial_Key). */
  psk: string;
  /** A — Thứ tự ưu tiên. */
  priority: number;
  /** B — Bộ phận. */
  unit: string;
  name: string;
  cardNo: string;
  joinDate: string;
  /** G — `null` = hệ thống chưa có loại hợp đồng (coi như chưa ký vô thời hạn). */
  contract: ContractType | null;
  /** H — mã chức danh (NV, TBP, PP, TRP…) + tên hệ thống kèm theo. */
  position: string;
  positionName: string;
  division: Division;
  expat: boolean;
  /** I — các lần được đề xuất thăng chức từ lúc vào Cty. */
  promotionHistory: string[];
  /** J — bình bầu ABC 12 tháng gần nhất, nguyên văn (đọc qua parseAbcRatings). */
  abc: string;
  /** K — vi phạm xử lý kỷ luật (rỗng = không). */
  discipline: string;
  status: EmployeeStatus;
  /** M — thời gian nghỉ ốm / thai sản / THHĐ. */
  leave: { from: string; to: string } | null;
  // N–R: CQ tự điền
  type: ProposalType;
  newTitle: string | null;
  reason: string;
  jobChange: string;
  /** R — "Theo bậc lương Cty (Follow salary's scale)" hoặc tự điền số tiền. */
  raiseMode: 'scale' | 'amount';
  raiseAmount: number | null;
  /** S — KPI hiện tại (hệ thống KPI). */
  kpi: number;
  salary?: SalaryInfo;
  /** AI — ý kiến của nhân sự. */
  hrOpinion?: string;
  board?: BoardDecision;
};

/** Phần đã sửa trên một dòng (chỉ các ô được nhập). */
export type PromotionEdit = Partial<{
  type: ProposalType;
  newTitle: string | null;
  reason: string;
  jobChange: string;
  raiseMode: 'scale' | 'amount';
  raiseAmount: number | null;
  hrOpinion: string;
  newContract: number | null;
  newRating: number | null;
  newAttendance: number | null;
  newLiving: number | null;
  boardType: BoardType | null;
  boardTitle: string | null;
  boardAmount: number | null;
  boardReason: string;
}>;

/** Ô nhập (quyền theo cột) mà mỗi khóa của PromotionEdit ghi vào. */
const EDIT_FIELD: Record<keyof PromotionEdit, PromotionField> = {
  type: 'type', newTitle: 'newTitle', reason: 'reason', jobChange: 'jobChange', raiseMode: 'raise', raiseAmount: 'raise',
  hrOpinion: 'hrOpinion',
  newContract: 'newContract', newRating: 'newRating', newAttendance: 'newAttendance', newLiving: 'newLiving',
  boardType: 'boardType', boardTitle: 'boardTitle', boardAmount: 'boardAmount', boardReason: 'boardReason',
};

export type OrgChartFile = { name: string; size: number; type: string; uploadedAt: string };

/** Nhóm xét duyệt (TTKT) — BLĐ duyệt từng nhóm. */
export type ReviewGroup = {
  id: string;
  name: string;
  /** Tổng số nhân viên của nhóm (cơ sở tính hạn mức %), trong đó `expatHeadcount` người nước ngoài. */
  headcount: number;
  expatHeadcount: number;
  status: GroupStatus;
  /** Lý do BLĐ trả lại (khi `returned`). */
  returnReason: string | null;
  orgCharts: Record<OrgChartSlot, OrgChartFile | null>;
  savedAt: string | null;
  /** Số nhân viên được CQ đề xuất trong nhóm. */
  proposed: number;
  /** Số đề xuất thăng chức / tăng lương của CQ (cột Promotion Qty / Salary raise Qty của sheet SUM). */
  promotions: number;
  raises: number;
};

export type PromotionPeriod = { id: string; month: string; effectiveDate: string; deadline: string };

export type PromotionProposal = {
  period: PromotionPeriod;
  /** Các nhóm người xem được thấy (đã lọc theo phạm vi). */
  groups: ReviewGroup[];
  /** Nhóm đang xem; `null` = không có nhóm nào trong phạm vi. */
  group: ReviewGroup | null;
  /** Bộ phận có trong nhóm đang xem. */
  units: string[];
  rows: PromotionRow[];
};

export type PromotionViewer = { role: AppRole; email: string };

const PERIOD: PromotionPeriod = { id: '2026-10', month: '2026-10', effectiveDate: EFFECTIVE_DATE, deadline: '2026-09-08' };

// ───────── Dữ liệu mẫu ─────────

type GroupSeed = Omit<ReviewGroup, 'savedAt' | 'proposed' | 'promotions' | 'raises'>;
const sampleChart = (name: string, size: number): OrgChartFile => ({ name, size, type: 'application/pdf', uploadedAt: '2026-09-05' });

const GROUPS: GroupSeed[] = [
  { id: 'transfer', name: 'TRANSFER TEAM', headcount: 40, expatHeadcount: 2, status: 'submitted', returnReason: null,
    orgCharts: { before: sampleChart('So_do_truoc_de_bat_TransferTeam.pdf', 1_258_291), after: sampleChart('So_do_sau_de_bat_TransferTeam.pdf', 1_363_149) } },
  { id: 'tooling', name: 'TOOLING', headcount: 39, expatHeadcount: 1, status: 'draft', returnReason: null,
    orgCharts: { before: sampleChart('So_do_truoc_de_bat_Tooling.pdf', 942_080), after: null } },
  { id: 'cc-planning', name: 'CC PLANNING', headcount: 8, expatHeadcount: 0, status: 'approved', returnReason: null,
    orgCharts: { before: sampleChart('So_do_truoc_de_bat_CCPlanning.pdf', 811_008), after: sampleChart('So_do_sau_de_bat_CCPlanning.pdf', 829_440) } },
  { id: 'ce', name: 'CE', headcount: 23, expatHeadcount: 1, status: 'returned', returnReason: 'Bổ sung lý do đề xuất cho các trường hợp thăng chức.',
    orgCharts: { before: sampleChart('So_do_truoc_de_bat_CE.pdf', 702_464), after: sampleChart('So_do_sau_de_bat_CE.pdf', 716_800) } },
  { id: 'erp', name: 'ERP', headcount: 33, expatHeadcount: 0, status: 'submitted', returnReason: null,
    orgCharts: { before: sampleChart('So_do_truoc_de_bat_ERP.pdf', 655_360), after: sampleChart('So_do_sau_de_bat_ERP.pdf', 671_744) } },
];

type RowSeed = Pick<PromotionRow, 'psk' | 'priority' | 'unit' | 'name' | 'cardNo' | 'joinDate' | 'contract' | 'position' | 'abc' | 'kpi' | 'type'> &
  Partial<Omit<PromotionRow, 'salary' | 'board'>> & {
    group: string;
    salary?: Partial<SalaryInfo> & Pick<SalaryInfo, 'contract' | 'rating' | 'attendance' | 'living'>;
    board?: Partial<BoardDecision>;
  };

const SEED: RowSeed[] = [
  // TRANSFER TEAM — 3 dòng đầu là ví dụ của file Excel (sheet 2026年07月名單).
  {
    group: 'transfer', psk: 'tr01', priority: 1, unit: 'XXX', name: 'NGUYỄN VĂN A', cardNo: '01234', joinDate: '2017-06-19', contract: 'permanent', position: 'PP',
    promotionHistory: ['2020-04-01', '2023-10-01'], abc: '3A, 3B', status: 'maternity', leave: { from: '2026-07-01', to: '2027-01-01' },
    type: 'both', newTitle: 'TRP', raiseAmount: 1_000_000, kpi: 2_000_000,
    reason: 'He is hardworking, responsible, and consistently delivers high-quality results.\nHe is willing to support both the DC and Factory teams to ensure Transfer projects are completed on schedule.\nHe demonstrates good planning, coordination, and team support capabilities.',
    jobChange: 'No, but he need more powerful to work with the other departments',
    salary: {
      history: [
        { date: '2019-01-01', amount: 7_500_000 }, { date: '2020-04-01', amount: 7_850_000 }, { date: '2021-07-01', amount: 8_020_000 },
        { date: '2021-08-19', amount: 8_460_000 }, { date: '2022-07-01', amount: 8_890_000 }, { date: '2022-08-19', amount: 9_180_000 },
        { date: '2023-07-01', amount: 9_680_000 }, { date: '2023-10-01', amount: 10_120_000 },
      ],
      contract: 10_120_000, rating: 500_000, attendance: 300_000, living: 1_000_000,
      newContract: 11_120_000, newRating: 500_000, newAttendance: 300_000, newLiving: 1_000_000,
    },
    hrOpinion: 'Đủ điều kiện. NV đang nghỉ thai sản đến 2027/01/01, đề nghị hiệu lực khi đi làm lại.',
    board: { type: 'both', title: 'TRP', amount: 1_000_000 },
  },
  {
    group: 'transfer', psk: 'tr02', priority: 2, unit: 'YYY', name: 'TRẦN THỊ B', cardNo: '56789', joinDate: '2025-08-01', contract: 'fixed', position: 'NV',
    abc: '4B, 1A, 1C', type: 'raise', raiseAmount: 500_000, kpi: 500_000,
    reason: 'She is hardworking, adaptable, and work effectively. She actively contributes constructive ideas to support team development, willing to support colleagues, and eager to learn new knowledge.',
    salary: { contract: 7_200_000, rating: 400_000, attendance: 300_000, living: 800_000, newContract: 7_700_000, newRating: 400_000, newAttendance: 300_000, newLiving: 800_000 },
    hrOpinion: 'Đồng ý tăng lương theo đề xuất của CQ.',
    board: { type: 'raise', amount: 500_000 },
  },
  {
    // Chưa có loại HĐ + 4C: theo quy định không được đề xuất; file Excel vẫn có dòng này và BLĐ từ chối (bắt buộc lý do).
    group: 'transfer', psk: 'tr03', priority: 3, unit: 'XYZ', name: 'LÝ VĂN C', cardNo: '34567', joinDate: '2026-02-06', contract: null, position: 'NV',
    abc: '2B, 4C', type: 'promotion', newTitle: 'TBP', raiseAmount: 1_000_000, kpi: 0,
    salary: { contract: 6_500_000, rating: 300_000, attendance: 300_000, living: 800_000 },
    hrOpinion: 'Không đủ điều kiện: có 4C trong 12 tháng, chưa ký HĐ vô thời hạn.',
    board: { type: 'reject', amount: 0 },
  },
  {
    group: 'transfer', psk: 'tr04', priority: 4, unit: 'XXX', name: 'PHẠM THỊ D', cardNo: '22871', joinDate: '2014-03-10', contract: 'permanent', position: 'TBP',
    promotionHistory: ['2018-10-01'], abc: '4C, 2B', type: 'raise', raiseMode: 'scale', kpi: 1_000_000,
    reason: 'Kinh nghiệm 12 năm, đang kèm 3 NV mới; 4C do nghỉ chăm con ốm dài ngày, hiệu suất đã ổn định lại từ tháng 6.',
    salary: { history: [{ date: '2022-04-01', amount: 9_100_000 }, { date: '2024-04-01', amount: 9_600_000 }], contract: 9_600_000, rating: 500_000, attendance: 300_000, living: 1_000_000, newRating: 500_000, newAttendance: 300_000, newLiving: 1_000_000 },
    hrOpinion: '',
    // CQ đề xuất "Theo bậc lương Cty" (chưa có số) → BLĐ nhập mức được tăng; Tăng lương thì phải > 0.
    board: { type: 'raise', amount: 1_000_000 },
  },
  {
    group: 'transfer', psk: 'tr05', priority: 5, unit: 'YYY', name: 'CHEN WEI-LUN', cardNo: 'TW0815', joinDate: '2021-11-15', contract: 'permanent', position: 'TRP', expat: true,
    promotionHistory: ['2024-04-01'], abc: '5A, 1B', type: 'none', kpi: 3_000_000,
    salary: { history: [{ date: '2024-04-01', amount: 42_000_000 }], contract: 42_000_000, rating: 0, attendance: 0, living: 3_500_000 },
  },

  // TOOLING — nhóm đang lập (đăng nhập CQ để sửa).
  { group: 'tooling', psk: 'tl01', priority: 1, unit: 'TL-A', name: 'HOÀNG VĂN E', cardNo: '10452', joinDate: '2016-05-03', contract: 'permanent', position: 'PP', promotionHistory: ['2021-10-01'], abc: '5A, 1B', type: 'none', kpi: 1_500_000,
    salary: { history: [{ date: '2021-10-01', amount: 9_800_000 }, { date: '2023-04-01', amount: 10_400_000 }], contract: 10_400_000, rating: 500_000, attendance: 300_000, living: 1_000_000 } },
  { group: 'tooling', psk: 'tl02', priority: 2, unit: 'TL-A', name: 'LÊ THỊ F', cardNo: '20817', joinDate: '2024-09-16', contract: 'fixed', position: 'NV', abc: '2B, 4C', type: 'none', kpi: 0,
    salary: { contract: 6_200_000, rating: 300_000, attendance: 300_000, living: 800_000 } },
  { group: 'tooling', psk: 'tl03', priority: 3, unit: 'TL-B', name: 'VŨ VĂN G', cardNo: '13390', joinDate: '2015-08-24', contract: 'permanent', position: 'TBP', abc: '2B, 4C', type: 'raise', raiseAmount: 600_000, kpi: 800_000,
    salary: { history: [{ date: '2024-10-01', amount: 8_900_000 }], contract: 8_900_000, rating: 400_000, attendance: 300_000, living: 1_000_000 } },
  { group: 'tooling', psk: 'tl04', priority: 4, unit: 'TL-B', name: 'NGÔ THỊ H', cardNo: '18604', joinDate: '2020-01-06', contract: 'fixed', position: 'NV', abc: '6A', type: 'promotion', newTitle: 'TBP', raiseAmount: 800_000, kpi: 1_000_000,
    reason: 'Hoàn thành 100% dự án khuôn mẫu Q2–Q3, đã thay TBP điều phối ca đêm 4 tháng.', jobChange: 'Phụ trách điều phối ca đêm tổ TL-B (6 NV).',
    salary: { history: [{ date: '2023-04-01', amount: 7_100_000 }], contract: 7_100_000, rating: 400_000, attendance: 300_000, living: 800_000 } },
  { group: 'tooling', psk: 'tl05', priority: 5, unit: 'TL-A', name: 'TANAKA KENJI', cardNo: 'JP0207', joinDate: '2022-02-14', contract: 'permanent', position: 'TRP', expat: true, abc: '4A, 2B', type: 'none', kpi: 2_500_000,
    salary: { contract: 38_000_000, rating: 0, attendance: 0, living: 3_000_000 } },
  { group: 'tooling', psk: 'tl06', priority: 6, unit: 'TL-C', name: 'ĐẶNG VĂN K', cardNo: '30921', joinDate: '2019-06-17', contract: 'permanent', position: 'NV', division: 'production', abc: '3A, 3B', type: 'none', kpi: 500_000,
    salary: { contract: 6_800_000, rating: 300_000, attendance: 300_000, living: 800_000 } },
  // Đã thôi việc: hệ thống nhân sự vẫn trả về nhưng không hiển thị.
  { group: 'tooling', psk: 'tl07', priority: 7, unit: 'TL-C', name: 'BÙI THỊ L', cardNo: '31008', joinDate: '2021-03-01', contract: 'fixed', position: 'NV', abc: '6B', status: 'resigned', type: 'none', kpi: 0,
    salary: { contract: 6_400_000, rating: 300_000, attendance: 300_000, living: 800_000 } },

  // Các nhóm khác (BLĐ chọn từng nhóm để xét duyệt).
  { group: 'cc-planning', psk: 'cc01', priority: 1, unit: 'CCP', name: 'MAI VĂN M', cardNo: '15530', joinDate: '2018-07-02', contract: 'permanent', position: 'TBP', abc: '4A, 2B', type: 'both', newTitle: 'PP', raiseAmount: 1_000_000, kpi: 1_500_000,
    reason: 'Dẫn dắt nhóm lập kế hoạch mùa FW27 đúng hạn.', jobChange: 'Quản lý thêm nhóm CCP-2.',
    salary: { contract: 9_200_000, rating: 500_000, attendance: 300_000, living: 1_000_000, newContract: 10_200_000, newRating: 500_000, newAttendance: 300_000, newLiving: 1_000_000 },
    hrOpinion: 'Đồng ý.', board: { type: 'both', title: 'PP', amount: 1_000_000 } },
  { group: 'ce', psk: 'ce01', priority: 1, unit: 'CE-1', name: 'TRỊNH VĂN N', cardNo: '17722', joinDate: '2019-04-08', contract: 'permanent', position: 'NV', abc: '5A, 1B', type: 'promotion', newTitle: 'TBP', raiseAmount: 700_000, kpi: 800_000,
    salary: { contract: 7_400_000, rating: 400_000, attendance: 300_000, living: 800_000 } },
  { group: 'erp', psk: 'er01', priority: 1, unit: 'ERP', name: 'PHAN THỊ P', cardNo: '19045', joinDate: '2020-09-14', contract: 'permanent', position: 'NV', abc: '3A, 3B', type: 'raise', raiseAmount: 700_000, kpi: 1_000_000,
    reason: 'Hoàn thành chuyển đổi module kho sang hệ thống mới.',
    salary: { contract: 8_300_000, rating: 400_000, attendance: 300_000, living: 800_000, newContract: 9_000_000, newRating: 400_000, newAttendance: 300_000, newLiving: 800_000 },
    hrOpinion: 'Đồng ý tăng lương.' },
];

const toRow = ({ salary, board, ...seed }: RowSeed): PromotionRow => {
  const s: Partial<RowSeed> = { ...seed };
  delete s.group;
  return {
    division: 'office',
    expat: false,
    promotionHistory: [],
    discipline: '',
    status: 'active',
    leave: null,
    newTitle: null,
    reason: '',
    jobChange: '',
    raiseMode: 'amount',
    raiseAmount: null,
    hrOpinion: '',
    ...(s as Omit<RowSeed, 'group' | 'salary' | 'board'>),
    // Tên chức danh hệ thống trả kèm mã (vd. "单位副主管PP") — hiển thị nguyên văn.
    positionName: seed.positionName ?? POSITION_CODES[seed.position]?.cn ?? '',
    salary: { history: [], newContract: null, newRating: null, newAttendance: null, newLiving: null, ...salary! },
    board: { type: null, title: null, amount: null, reason: '', ...board },
  };
};

/** Toàn bộ dòng mẫu như các hệ thống trả về (kể cả người đã thôi việc, đủ mọi nhóm cột). */
export const SAMPLE_ROWS: readonly PromotionRow[] = SEED.map(toRow);

/** Nhóm xét duyệt của từng nhân viên mẫu (theo psk). */
export const SAMPLE_GROUP_OF: Readonly<Record<string, string>> = Object.fromEntries(SEED.map((s) => [s.psk, s.group]));

/** Nhân viên được hiển thị: bỏ người đã thôi việc. */
export const isListed = (row: Pick<PromotionRow, 'status'>) => row.status !== 'resigned';

/**
 * Phạm vi của Chủ quản trong bản mẫu (theo email đăng nhập).
 * TODO: server phải tự lọc theo phạm vi do Admin gán (trang Phân quyền) và trả 403 khi vượt phạm vi.
 */
const MANAGER_SCOPE: Record<string, string[]> = {
  'chuquan.dev@example.com': ['tooling', 'transfer'],
};

const groupIdsOf = (viewer: PromotionViewer) =>
  viewer.role === 'CQ' ? (MANAGER_SCOPE[viewer.email] ?? []) : viewer.role === 'NV' ? [] : GROUPS.map((g) => g.id);

/**
 * Bỏ khỏi dòng các nhóm cột vai trò không được xem (lương, ý kiến HR, quyết định BLĐ) — không chỉ ẩn trên giao diện.
 * TODO: server BẮT BUỘC làm việc này; dữ liệu lương không bao giờ được gửi tới CQ/Admin.
 */
export function visibleRow(row: PromotionRow, role: AppRole): PromotionRow {
  const { salary, hrOpinion, board, ...rest } = row;
  return {
    ...rest,
    ...(canView(role, 'salary') && salary ? { salary } : null),
    ...(canView(role, 'hrOpinion') && hrOpinion !== undefined ? { hrOpinion } : null),
    ...(canView(role, 'board') && board ? { board } : null),
  };
}

/** Áp một phần sửa vào dòng (đúng chỗ của từng nhóm cột). */
export function applyEdit(row: PromotionRow, edit: PromotionEdit | undefined): PromotionRow {
  if (!edit) return row;
  const { hrOpinion, newContract, newRating, newAttendance, newLiving, boardType, boardTitle, boardAmount, boardReason, ...cq } = edit;
  const next: PromotionRow = { ...row, ...cq };
  if (hrOpinion !== undefined && row.hrOpinion !== undefined) next.hrOpinion = hrOpinion;
  if (row.salary) {
    const s = { newContract, newRating, newAttendance, newLiving };
    next.salary = { ...row.salary, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined)) };
  }
  if (row.board) {
    const b = { type: boardType, title: boardTitle, amount: boardAmount, reason: boardReason };
    next.board = { ...row.board, ...Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)) };
  }
  return next;
}

// ───────── Lưu trữ của bản mẫu ─────────

type StoredGroup = Partial<Pick<ReviewGroup, 'status' | 'returnReason' | 'orgCharts' | 'savedAt'>> & { edits?: Record<string, PromotionEdit> };
type Stored = Record<string, StoredGroup>;
const STORE_KEY = `promotion-proposal-mock:v1:${PERIOD.id}`;

const read = (): Stored => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* storage bị chặn hoặc dữ liệu hỏng: dùng dữ liệu gốc */
  }
  return {};
};

const write = (s: Stored) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage bị chặn: chỉ mất phần lưu của bản mẫu */
  }
};

/** File sơ đồ tổ chức vừa tải lên (chỉ trong phiên; bản mẫu không có nơi lưu file). TODO: upload lên server. */
const uploadedFiles = new Map<string, File>();
const fileKey = (groupId: string, slot: OrgChartSlot) => `${groupId}:${slot}`;


/** Giả lập độ trễ mạng để trạng thái đang tải/đang lưu hiện ra như khi có API. */
const delay = <T>(value: T, ms = 250) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Giữ lại các ô vai trò được phép ghi ở trạng thái hiện tại, bỏ phần còn lại — mô phỏng việc server kiểm tra quyền theo cột.
 * TODO: server phải trả 403 (không âm thầm bỏ qua) khi nhận ô không được phép.
 */
const allowedEdits = (viewer: PromotionViewer, status: GroupStatus, edits: Record<string, PromotionEdit>) =>
  Object.fromEntries(
    Object.entries(edits).map(([psk, edit]) => [
      psk,
      Object.fromEntries(Object.entries(edit).filter(([k]) => canEdit(viewer.role, status, EDIT_FIELD[k as keyof PromotionEdit]))) as PromotionEdit,
    ])
  );

const mergeEdits = (current: Record<string, PromotionEdit> = {}, edits: Record<string, PromotionEdit>) => {
  const merged = { ...current };
  for (const [psk, edit] of Object.entries(edits)) merged[psk] = { ...merged[psk], ...edit };
  return merged;
};

/** Dòng đầy đủ (chưa lọc theo vai trò) của một nhóm, đã áp bản nháp. */
const rowsOf = (stored: Stored, groupId: string) =>
  SAMPLE_ROWS.filter((r) => SAMPLE_GROUP_OF[r.psk] === groupId && isListed(r)).map((r) => applyEdit(r, stored[groupId]?.edits?.[r.psk]));

const groupOf = (stored: Stored, seed: GroupSeed): ReviewGroup => {
  const s = stored[seed.id] ?? {};
  const rows = rowsOf(stored, seed.id);
  return {
    ...seed,
    status: s.status ?? seed.status,
    returnReason: s.returnReason !== undefined ? s.returnReason : seed.returnReason,
    orgCharts: s.orgCharts ?? seed.orgCharts,
    savedAt: s.savedAt ?? null,
    proposed: rows.filter((r) => r.type !== 'none').length,
    promotions: rows.filter((r) => hasPromotion(r.type)).length,
    raises: rows.filter((r) => hasRaise(r.type)).length,
  };
};

/** Nhóm mặc định: CQ → nhóm đang lập/bị trả lại; BLĐ, HR, KT → nhóm chờ duyệt; còn lại nhóm đầu tiên. */
const defaultGroup = (role: AppRole, groups: ReviewGroup[]) => {
  const wanted: GroupStatus[] = role === 'CQ' ? ['draft', 'returned'] : ['submitted'];
  return groups.find((g) => wanted.includes(g.status)) ?? groups[0] ?? null;
};

const scopedGroup = (viewer: PromotionViewer, stored: Stored, groupId: string) => {
  const seed = GROUPS.find((g) => g.id === groupId);
  if (!seed || !groupIdsOf(viewer).includes(groupId)) throw new Error('Group out of scope');
  return groupOf(stored, seed);
};

export async function getPromotionProposal(viewer: PromotionViewer, groupId?: string | null): Promise<PromotionProposal> {
  const stored = read();
  const ids = groupIdsOf(viewer);
  const groups = GROUPS.filter((g) => ids.includes(g.id)).map((g) => groupOf(stored, g));
  const group = groups.find((g) => g.id === groupId) ?? defaultGroup(viewer.role, groups);
  const rows = group ? rowsOf(stored, group.id).map((r) => visibleRow(r, viewer.role)) : [];
  return delay({ period: PERIOD, groups, group, units: [...new Set(rows.map((r) => r.unit))], rows });
}

export async function savePromotionDraft(viewer: PromotionViewer, groupId: string, edits: Record<string, PromotionEdit>) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  const savedAt = new Date().toISOString();
  write({ ...stored, [groupId]: { ...stored[groupId], edits: mergeEdits(stored[groupId]?.edits, allowedEdits(viewer, group.status, edits)), savedAt } });
  return delay({ savedAt });
}

/** CQ gửi đề xuất của nhóm (bắt buộc đủ 2 sơ đồ tổ chức). */
export async function submitPromotionProposal(viewer: PromotionViewer, groupId: string, edits: Record<string, PromotionEdit>) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  if (viewer.role !== 'CQ' || !['draft', 'returned'].includes(group.status)) throw new Error('Proposal is not editable');
  if (!group.orgCharts.before || !group.orgCharts.after) throw new Error('Organization charts are required');
  const savedAt = new Date().toISOString();
  write({ ...stored, [groupId]: { ...stored[groupId], edits: mergeEdits(stored[groupId]?.edits, allowedEdits(viewer, group.status, edits)), status: 'submitted', returnReason: null, savedAt } });
  return delay({ savedAt });
}

/** BLĐ phê duyệt nhóm (dòng Từ chối bắt buộc có lý do). */
export async function approvePromotionProposal(viewer: PromotionViewer, groupId: string, edits: Record<string, PromotionEdit>) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  if (viewer.role !== 'BLD' || group.status !== 'submitted') throw new Error('Proposal is not submitted');
  const merged = mergeEdits(stored[groupId]?.edits, allowedEdits(viewer, group.status, edits));
  const rows = rowsOf({ ...stored, [groupId]: { ...stored[groupId], edits: merged } }, groupId);
  if (rows.some((r) => r.board?.type === 'reject' && !r.board.reason.trim())) throw new Error('Rejected rows need a reason');
  const savedAt = new Date().toISOString();
  write({ ...stored, [groupId]: { ...stored[groupId], edits: merged, status: 'approved', savedAt } });
  return delay({ savedAt });
}

/**
 * BLĐ trả lại cho CQ (bắt buộc lý do); nhóm về trạng thái CQ sửa được.
 * TODO(chị Kitty): xác nhận có tính năng "Trả lại CQ" (file chỉ mô tả Phê duyệt / Từ chối từng dòng).
 */
export async function returnPromotionProposal(viewer: PromotionViewer, groupId: string, reason: string, edits: Record<string, PromotionEdit>) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  if (viewer.role !== 'BLD' || group.status !== 'submitted') throw new Error('Proposal is not submitted');
  if (!reason.trim()) throw new Error('A reason is required');
  const savedAt = new Date().toISOString();
  write({ ...stored, [groupId]: { ...stored[groupId], edits: mergeEdits(stored[groupId]?.edits, allowedEdits(viewer, group.status, edits)), status: 'returned', returnReason: reason.trim(), savedAt } });
  return delay({ savedAt });
}

/** Lỗi của file sơ đồ tổ chức: sai định dạng hoặc quá dung lượng; `null` = hợp lệ. */
export function orgChartError(file: Pick<File, 'name' | 'size' | 'type'>): 'type' | 'size' | null {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const typeOk = (ORG_CHART.types as readonly string[]).includes(file.type) || (ORG_CHART.extensions as readonly string[]).includes(ext);
  if (!typeOk) return 'type';
  return file.size > ORG_CHART.maxBytes ? 'size' : null;
}

/** CQ tải lên sơ đồ tổ chức Trước / Sau đề bạt. TODO: upload file thật lên server (bản mẫu chỉ giữ trong bộ nhớ). */
export async function uploadOrgChart(viewer: PromotionViewer, groupId: string, slot: OrgChartSlot, file: File) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  if (viewer.role !== 'CQ' || !['draft', 'returned'].includes(group.status)) throw new Error('Proposal is not editable');
  const error = orgChartError(file);
  if (error) throw new Error(error);
  uploadedFiles.set(fileKey(groupId, slot), file);
  const meta: OrgChartFile = { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString().slice(0, 10) };
  write({ ...stored, [groupId]: { ...stored[groupId], orgCharts: { ...group.orgCharts, [slot]: meta } } });
  return delay(meta);
}

export async function removeOrgChart(viewer: PromotionViewer, groupId: string, slot: OrgChartSlot) {
  const stored = read();
  const group = scopedGroup(viewer, stored, groupId);
  if (viewer.role !== 'CQ' || !['draft', 'returned'].includes(group.status)) throw new Error('Proposal is not editable');
  uploadedFiles.delete(fileKey(groupId, slot));
  write({ ...stored, [groupId]: { ...stored[groupId], orgCharts: { ...group.orgCharts, [slot]: null } } });
  return delay(null);
}

/** File đã tải lên trong phiên này (để Xem / Tải về); `null` = file mẫu, chưa có nội dung. */
export const orgChartBlob = (groupId: string, slot: OrgChartSlot): File | null => uploadedFiles.get(fileKey(groupId, slot)) ?? null;
