/**
 * Cấu hình nghiệp vụ màn Thăng chức & lương (LYV's Promotion & Salary Proposal) — MỘT nơi duy nhất:
 * quyền xem/sửa theo nhóm cột, quy tắc 4C, hạn mức %, bậc chức danh. Trang, service mẫu và unit test đều đọc từ đây.
 * Nguồn: docs/specs/Website_for_Promotion___Salary_proposal.xlsx (sheet 2026年07月名單, Promotion levels, SUM,
 * các sheet ẩn General process và Evaluation Process).
 */
import type { AppRole } from '@/lib/session';

// ───────── Nhóm cột & quyền ─────────

/**
 * 6 nhóm cột của sheet 2026年07月名單 (A–AN):
 *   hr = A–M dữ liệu hệ thống nhân sự · cq = N–R CQ tự điền · kpi = S hệ thống KPI ·
 *   salary = T–AH hệ thống lương + Kế toán tạm tính · hrOpinion = AI ý kiến HR · board = AJ–AN BLĐ quyết định.
 */
export const COLUMN_GROUPS = ['hr', 'cq', 'kpi', 'salary', 'hrOpinion', 'board'] as const;
export type ColumnGroup = (typeof COLUMN_GROUPS)[number];

/**
 * Nhóm cột từng vai trò được XEM. Nhóm không có trong danh sách thì không render và service mẫu cũng không trả dữ liệu.
 *   CQ : 3 nhóm (nhân sự, CQ tự điền, KPI) — không thấy lương, ý kiến HR, quyết định BLĐ.
 *   HR, KT, BLĐ: đủ 6 nhóm.
 *   AD : mọi nhóm TRỪ lương — theo file: "chỉ có Kế toán, Nhân sự & BLĐ mới có thể xem được những thông tin về lương".
 *        TODO(chị Kitty): xác nhận Admin không được xem nhóm lương.
 * TODO: server bắt buộc lọc các trường theo bảng này; client chỉ hiển thị.
 */
export const GROUP_VIEW: Record<AppRole, readonly ColumnGroup[]> = {
  CQ: ['hr', 'cq', 'kpi'],
  HR: COLUMN_GROUPS,
  KT: COLUMN_GROUPS,
  BLD: COLUMN_GROUPS,
  AD: ['hr', 'cq', 'kpi', 'hrOpinion', 'board'],
  NV: [],
};

/**
 * Bật ẩn nhóm cột theo `GROUP_VIEW`. Hiện TẮT theo yêu cầu (2026-10-24: "hiện tại show hết tất cả các cột, chưa cần ẩn"):
 * mọi vai trò thấy đủ 40 cột và dữ liệu cả 6 nhóm — kể cả lương với CQ / Admin (dữ liệu mẫu).
 * Quyền SỬA từng cột (`ROLE_EDIT`) không đổi. Bật lại = đổi thành `true` (cột hẹp "15 cột lương" sẽ tự hiện cho CQ, Admin).
 * TODO: khi nối API, server phải lọc dữ liệu theo quyền thật — cờ này chỉ quyết định giao diện / service mẫu.
 */
export const HIDE_GROUPS_BY_ROLE = false;

/** Vai trò có được xem nhóm cột không. `hiding` mặc định theo `HIDE_GROUPS_BY_ROLE`; test truyền `true` để kiểm tra `GROUP_VIEW`. */
export const canView = (role: AppRole, group: ColumnGroup, hiding = HIDE_GROUPS_BY_ROLE) => !hiding || GROUP_VIEW[role].includes(group);

/**
 * 40 cột A–AN theo đúng thứ tự file, chia theo nhóm. Key là khóa i18n `promotion:cols.*` (tiêu đề nguyên văn VI + 中文).
 * Cột 24–26 và 30–32 trùng tên trong file → key khác nhau (`currentRating` / `newRating`…) và nằm dưới nhóm con.
 */
export const COLUMN_KEYS = {
  hr: ['priority', 'unit', 'name', 'cardNo', 'joinDate', 'seniority', 'contract', 'position', 'promotionCount', 'abc', 'discipline', 'status', 'leave'],
  cq: ['type', 'newTitle', 'reason', 'jobChange', 'raise'],
  kpi: ['kpi'],
  salary: [
    'salaryAdjustments', 'salaryLevels', 'currentTitle', 'contractSalary', 'currentRating', 'currentAttendance', 'currentLiving', 'totalCurrent',
    'newPosition', 'newContract', 'newRating', 'newAttendance', 'newLiving', 'totalNew', 'diffOldNew',
  ],
  hrOpinion: ['hrOpinion'],
  board: ['boardType', 'boardTitle', 'boardAmount', 'boardDiff', 'boardDecision'],
} as const satisfies Record<ColumnGroup, readonly string[]>;
export type PromotionColumn = (typeof COLUMN_KEYS)[ColumnGroup][number];

/** Các cột một vai trò được xem, theo thứ tự file (CQ 19, Admin 25, HR/KT/BLĐ 40). */
export const visibleColumns = (role: AppRole, hiding = HIDE_GROUPS_BY_ROLE): PromotionColumn[] =>
  COLUMN_GROUPS.filter((g) => canView(role, g, hiding)).flatMap((g) => COLUMN_KEYS[g]);

/** Nhóm con trong nhóm lương: "Hiện tại / 目前" trên X–Z, "Sau khi tăng / 調整後" trên AD–AF (key i18n `promotion:subgroups.*`). */
export const SALARY_SUBGROUPS = [
  { key: 'current', from: 'currentRating', span: 3 },
  { key: 'after', from: 'newRating', span: 3 },
] as const satisfies readonly { key: string; from: PromotionColumn; span: number }[];

/** Trạng thái đề xuất của một nhóm xét duyệt. `returned` = BLĐ trả lại, CQ sửa và gửi lại như `draft`. */
export type GroupStatus = 'draft' | 'submitted' | 'approved' | 'returned';

/** Các ô được nhập trên mỗi dòng. */
export type PromotionField =
  | 'position'
  | 'type' | 'newTitle' | 'reason' | 'jobChange' | 'raise'
  | 'hrOpinion'
  | 'newContract' | 'newRating' | 'newAttendance' | 'newLiving'
  | 'boardType' | 'boardTitle' | 'boardAmount' | 'boardReason';

/** Nhóm cột chứa từng ô nhập (để service bỏ ô của nhóm vai trò không được xem). */
export const FIELD_GROUP: Record<PromotionField, ColumnGroup> = {
  position: 'hr',
  type: 'cq', newTitle: 'cq', reason: 'cq', jobChange: 'cq', raise: 'cq',
  hrOpinion: 'hrOpinion',
  newContract: 'salary', newRating: 'salary', newAttendance: 'salary', newLiving: 'salary',
  boardType: 'board', boardTitle: 'board', boardAmount: 'board', boardReason: 'board',
};

/**
 * Quyền SỬA theo cột, theo vai trò và trạng thái nhóm — component chỉ hỏi `canEdit`, không tự đặt điều kiện vai trò.
 *   CQ : nhóm CQ tự điền (N–R) và "Chức vụ" (H, có danh sách chọn trong file) khi đang lập hoặc bị trả lại.
 *        TODO(chị Kitty): xác nhận ai được sửa Chức vụ (dữ liệu từ hệ thống nhân sự) — tạm cho CQ.
 *   HR : "Ý kiến của nhân sự" (AI) khi đã gửi.
 *   KT : các cột lương tạm tính (AC–AF) khi đã gửi.
 *   BLĐ: nhóm BLĐ (AJ, AK, AL, lý do ở AN) khi đã gửi.
 *   AD : chỉ xem — TRỪ khi `ADMIN_ACTS_AS_BOARD` bật thì Admin làm thay BLĐ.
 *        TODO(chị Kitty): bước Admin kiểm tra dữ liệu rồi chuyển HR/KT (sheet Evaluation Process) chưa làm.
 * TODO: server phải từ chối (403) khi một vai trò ghi vào cột/ở trạng thái không được phép.
 */
/**
 * TẠM (2026-11-03): backend chỉ đăng nhập ra Admin / CQ, chưa có tài khoản BLĐ → Admin đóng vai BLĐ:
 * sửa các cột BLĐ (AJ–AN), Trả lại CQ, Phê duyệt nhóm khi nhóm đang Chờ duyệt. Có vai trò BLĐ thật thì đổi thành `false`.
 */
export const ADMIN_ACTS_AS_BOARD = true;

/** Vai trò làm việc của BLĐ (duyệt, trả lại, quyết định từng dòng). */
export const actsAsBoard = (role: AppRole) => role === 'BLD' || (ADMIN_ACTS_AS_BOARD && role === 'AD');

const BOARD_EDIT = { statuses: ['submitted'], fields: ['boardType', 'boardTitle', 'boardAmount', 'boardReason'] } as const;

export const ROLE_EDIT: Record<AppRole, { statuses: readonly GroupStatus[]; fields: readonly PromotionField[] }> = {
  CQ: { statuses: ['draft', 'returned'], fields: ['position', 'type', 'newTitle', 'reason', 'jobChange', 'raise'] },
  HR: { statuses: ['submitted'], fields: ['hrOpinion'] },
  KT: { statuses: ['submitted'], fields: ['newContract', 'newRating', 'newAttendance', 'newLiving'] },
  BLD: BOARD_EDIT,
  AD: ADMIN_ACTS_AS_BOARD ? BOARD_EDIT : { statuses: [], fields: [] },
  NV: { statuses: [], fields: [] },
};

/**
 * TẠM (2026-11-03, giai đoạn dữ liệu giả): CQ và Admin chọn được các cột BLĐ (AJ–AN) ở MỌI trạng thái trừ "Đã duyệt",
 * để thử danh sách chọn như file. Chỉ mở ô nhập — Trả lại / Phê duyệt vẫn chỉ khi nhóm Chờ duyệt.
 * Hết giai đoạn thử thì đổi thành `false`.
 */
export const DEV_OPEN_BOARD_FIELDS = true;
const devBoardEdit = (role: AppRole, status: GroupStatus) => DEV_OPEN_BOARD_FIELDS && (role === 'CQ' || role === 'AD') && status !== 'approved';

export const canEdit = (role: AppRole, status: GroupStatus, field: PromotionField) =>
  canView(role, FIELD_GROUP[field]) &&
  ((ROLE_EDIT[role].statuses.includes(status) && ROLE_EDIT[role].fields.includes(field)) || (FIELD_GROUP[field] === 'board' && devBoardEdit(role, status)));

/** Vai trò đang thao tác trên nhóm ở trạng thái này (có nút Lưu / Gửi / Duyệt). */
export const isEditor = (role: AppRole, status: GroupStatus) => ROLE_EDIT[role].statuses.includes(status) || devBoardEdit(role, status);

// ───────── Loại đề xuất ─────────

/**
 * Cột N "Thăng chức hoặc tăng lương" của CQ — như danh sách chọn trong file: promotion / raise salary
 * (`none` = chưa chọn, ô trống trong file). Thăng chức luôn kèm tăng lương ("Promoted & increased salary").
 */
export const PROPOSAL_TYPES = ['none', 'promotion', 'raise'] as const;
export type ProposalType = (typeof PROPOSAL_TYPES)[number];

/** Cột AJ của BLĐ: theo đề xuất của CQ nhưng sửa được (promotion / raise salary), thêm "Từ chối" (Rejected). */
export const BOARD_TYPES = ['promotion', 'raise', 'reject'] as const;
export type BoardType = (typeof BOARD_TYPES)[number];

export const hasPromotion = (t: ProposalType | BoardType | null | undefined) => t === 'promotion';
/** Có tăng lương: "raise salary", và cả "promotion" (thăng chức + tăng lương). */
export const hasRaise = (t: ProposalType | BoardType | null | undefined) => t === 'raise' || t === 'promotion';

// ───────── Quy tắc ─────────

/**
 * Quy định Cty về 4C trong 12 tháng (đọc số C qua parseAbcRatings, không so chuỗi):
 *   chưa ký HĐLĐ vô thời hạn + ≥ 4C → không được tái ký HĐ → CQ KHÔNG thể chọn đề xuất (khóa ô, tooltip lý do);
 *   đã ký HĐ vô thời hạn + ≥ 4C     → CQ chọn được nhưng bắt buộc ghi lý do cụ thể.
 */
export const ABC_LOCK = { cCount: 4 } as const;

/**
 * Hạn mức (Headcount budget, chỉ cho High Performing Individuals), tính theo từng nhóm và cập nhật mỗi lần CQ chọn:
 *   thăng chức 5% (local & expat); tăng lương 10% local, 5% expat.
 * `mode: 'warn'` = vượt thì cảnh báo màu cam, KHÔNG chặn gửi. TODO(chị Kitty): xác nhận chặn hay chỉ cảnh báo.
 */
export const HEADCOUNT_RULES = {
  promotion: 5,
  raiseLocal: 10,
  raiseExpat: 5,
  mode: 'warn' as 'warn' | 'block',
} as const;

/** Sơ đồ tổ chức (bắt buộc để hoàn tất): 2 file Trước / Sau đề bạt. */
export const ORG_CHART = {
  slots: ['before', 'after'] as const,
  maxBytes: 10 * 1024 * 1024,
  types: ['application/pdf', 'image/png', 'image/jpeg'] as const,
  extensions: ['.pdf', '.png', '.jpg', '.jpeg'] as const,
} as const;
export type OrgChartSlot = (typeof ORG_CHART.slots)[number];

/** Ngày hiệu lực của đợt (C2 "Effective date"), dùng tính thâm niên như công thức F5 =(DATE(2026,10,1)-E5)/365. */
export const EFFECTIVE_DATE = '2026-10-01';

// ───────── Bậc chức danh (sheet Promotion levels) ─────────

/** Khối VP (Indirect Unit, Non-production) / Khối SX. */
export type Division = 'office' | 'production';

/** 17 bậc lãnh đạo của Khối VP — dữ liệu nghiệp vụ, hiển thị nguyên văn 3 thứ tiếng như file. */
export const PROMOTION_LEVELS = [
  { level: 1, en: 'President', vi: 'Chủ Tịch HĐQT', cn: '董事長', tier: 'Leadership Level - LDD6' },
  { level: 2, en: 'Senior General Manager', vi: 'Tổng Giám Đốc điều hành', cn: '執行總經理', tier: 'Leadership Level - LDD6' },
  { level: 3, en: 'General Manager', vi: 'Tổng Giám Đốc', cn: '總經理', tier: 'Leadership Level - LDD6' },
  { level: 4, en: 'Senior Vice General Manager', vi: 'Phó Tổng cấp cao', cn: '副總經理', tier: 'Leadership Level - LDD6' },
  { level: 5, en: 'Vice General Manager', vi: 'Phó Tổng', cn: '副總', tier: 'Leadership Level - LDD6' },
  { level: 6, en: 'Senior Director', vi: 'Hiệp lý điều hành', cn: '執行經理', tier: 'Manager Level - LDD4' },
  { level: 7, en: 'Director', vi: 'Hiệp Lý', cn: '協理', tier: 'Manager Level - LDD4' },
  { level: 8, en: 'Assistant Director', vi: 'Phó Hiệp Lý', cn: '副協理', tier: 'Manager Level - LDD4' },
  { level: 9, en: 'Senior Manager', vi: 'Giám Đốc điều hành', cn: '執行經理', tier: 'Manager Level - LDD4' },
  { level: 10, en: 'Manager', vi: 'Giám Đốc', cn: '經理', tier: 'Manager Level - LDD4' },
  { level: 11, en: 'Assistant Manager', vi: 'Phó Giám Đốc', cn: '副經理', tier: 'Manager Level - LDD4' },
  { level: 12, en: 'Senior Supervisor', vi: 'Tương lý', cn: '襄裡', tier: 'Supervisor Level - LDD2' },
  { level: 13, en: 'Supervisor', vi: 'Chủ Nhiệm', cn: '主任', tier: 'Supervisor Level - LDD2' },
  { level: 14, en: 'Assistant Supervisor', vi: 'Phó chủ nhiệm', cn: '副主任', tier: 'Supervisor Level - LDD2' },
  { level: 15, en: 'Section Supervisor', vi: 'Trưởng phòng', cn: '課長', tier: 'Supervisor Level - LDD2' },
  { level: 16, en: 'Assistant Section Supervisor', vi: 'Phó phòng', cn: '副課長', tier: 'Supervisor Level - LDD2' },
  { level: 17, en: 'Team Leader', vi: 'Trưởng bộ phận', cn: '組長', tier: 'Supervisor Level - LDD2' },
] as const;

/**
 * Mã chức danh trong hệ thống nhân sự → bậc (sheet Promotion levels không có các mã này; tạm quy đổi theo tên tiếng Trung).
 * `level: null` = nhân viên, dưới bậc 17. `cn` là tên hệ thống trả kèm mã (hiển thị nguyên văn).
 * TODO(chị Kitty): xác nhận bảng quy đổi PP/TRP/TBP/PCN/NV → 17 bậc.
 */
export const POSITION_CODES: Record<string, { level: number | null; cn: string }> = {
  NV: { level: null, cn: '職員' },
  TBP: { level: 17, cn: '單位小主管' },
  PP: { level: 16, cn: '單位副主管' },
  TRP: { level: 15, cn: '單位主管' },
  PCN: { level: 14, cn: '副主任' },
  CN: { level: 13, cn: '主任' },
  TLY: { level: 12, cn: '襄理' },
  PGĐ: { level: 11, cn: '副經理' },
};

/** Tên chức danh như file: tên tiếng Trung liền mã ("單位主管TRP"); mã chưa có trong bảng thì chỉ hiện mã. */
export const positionLabel = (code: string) => `${POSITION_CODES[code]?.cn ?? ''}${code}`;

/** Danh sách chọn "Chức vụ" / "Chức danh mới" đúng thứ tự trong file (cao → thấp). */
export const TITLE_LIST = ['PGĐ', 'TLY', 'CN', 'PCN', 'TRP', 'PP', 'TBP', 'NV'] as const;

/**
 * Thang thăng chức theo khối, từ thấp lên cao — "Promotion level by level, don't jump over levels".
 * Hệ thống chỉ hiển thị chức danh của đúng khối VP hoặc SX.
 * TODO(chị Kitty): danh sách chức danh Khối SX chưa có trong file → khối SX chưa chọn được chức danh mới.
 */
export const POSITION_LADDER: Record<Division, readonly string[]> = {
  office: ['NV', 'TBP', 'PP', 'TRP', 'PCN', 'CN', 'TLY', 'PGĐ'],
  production: [],
};

/** Chức danh được chọn khi thăng chức: chỉ bậc kế tiếp trong đúng khối (rỗng nếu đã ở bậc cao nhất hoặc khối chưa có thang). */
export const nextPositions = (code: string, division: Division): string[] => {
  const ladder = POSITION_LADDER[division];
  const i = ladder.indexOf(code);
  return i >= 0 && i < ladder.length - 1 ? [ladder[i + 1]] : [];
};

/** Bậc (1–17) của một mã chức danh; `null` = dưới bậc 17 hoặc chưa quy đổi. */
export const levelOf = (code: string) => POSITION_CODES[code]?.level ?? null;
export const levelInfo = (code: string) => PROMOTION_LEVELS.find((l) => l.level === levelOf(code)) ?? null;
