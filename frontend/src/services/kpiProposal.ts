/**
 * Dữ liệu trang Đề xuất KPI — hiện là DỮ LIỆU MẪU, chưa gọi API.
 * Khi backend có endpoint, thay thân các hàm bằng `http.*` (lib/axios.ts) và giữ nguyên kiểu:
 *   getKpiProposal       → GET  /kpi-proposals/current
 *   saveKpiProposalDraft → PUT  /kpi-proposals/current/draft
 *   submitKpiProposal    → POST /kpi-proposals/current/submit   (CQ)
 *   approveKpiProposal   → POST /kpi-proposals/current/approve  (BLĐ)
 *   returnKpiProposal    → POST /kpi-proposals/current/return   (BLĐ)
 * Bản mẫu lưu nháp/trạng thái vào localStorage (dùng chung cho mọi tài khoản trên máy) để còn sau khi tải lại trang.
 * Các trường giữ riêng như hệ thống nhân sự (số thẻ, tình trạng, thời gian nghỉ, ngày thôi việc…) vì file Excel xuất ra
 * cần đủ cột như mẫu gốc — chỉ khi hiển thị mới gộp. Tên bộ phận, họ tên, chức vụ, bình bầu là dữ liệu hệ thống,
 * hiển thị nguyên văn. Ngày lưu ISO `YYYY-MM-DD`.
 */
import { canEdit, type EditableField, type ProposalResult, type ProposalStatus } from '@/config/kpi-proposal';
import type { AppRole } from '@/lib/session';

/** Tình trạng nhân viên lấy từ hệ thống nhân sự. `resigned` (đã thôi việc) không bao giờ hiển thị. */
export type EmployeeStatus = 'active' | 'maternity' | 'sickLeave' | 'resigning' | 'contractSuspended' | 'resigned';

export type ProposalRow = {
  /** Khóa nhân viên (Person_Serial_Key). */
  psk: string;
  unit: string;
  name: string;
  cardNo: string;
  joinDate: string;
  /** Thâm niên (năm). */
  seniority: number;
  position: string;
  /** Bình bầu A-B-C 3 tháng gần nhất, nguyên văn từ hệ thống (vd. "1B, 2C") — đọc qua parseAbcRatings. */
  abc: string;
  status: EmployeeStatus;
  /** Thời gian nghỉ ốm / thai sản / tạm hoãn hợp đồng. */
  leave: { from: string; to: string } | null;
  resignDate: string | null;
  /** Số tiền KPI kỳ trước (lấy từ hệ thống). */
  prev: number;
  /** Công việc đang phụ trách & hiệu suất (CQ). */
  duties: string;
  result: ProposalResult;
  /** Số tiền KPI kỳ này (CQ); `null` = chưa nhập. */
  next: number | null;
  note: string;
  /** Quyết định của BLĐ — chỉ BLĐ cập nhật; `null` = chưa có. */
  boardDecision: string | null;
};

/** Phần đã sửa trên một dòng (chỉ các ô được nhập). */
export type ProposalEdit = Partial<Pick<ProposalRow, EditableField>>;

export type ProposalPeriod = {
  id: string;
  /** Đợt đề xuất thứ mấy. */
  round: number;
  quarter: number;
  year: number;
  /** Kỳ trước / kỳ này theo tháng `YYYY-MM`. */
  prev: { from: string; to: string };
  next: { from: string; to: string };
  deadline: string;
};

export type KpiProposal = {
  period: ProposalPeriod;
  status: ProposalStatus;
  /** ISO datetime lần lưu nháp gần nhất. */
  savedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  /** Các bộ phận người xem được thấy (đã lọc theo phạm vi). */
  units: string[];
  rows: ProposalRow[];
};

export type ProposalViewer = { role: AppRole; email: string };

const PERIOD: ProposalPeriod = {
  id: '2026-Q4',
  round: 4,
  quarter: 4,
  year: 2026,
  prev: { from: '2026-07', to: '2026-09' },
  next: { from: '2026-10', to: '2026-12' },
  deadline: '2026-10-25',
};

const UNITS = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];

type Seed = Pick<ProposalRow, 'psk' | 'unit' | 'name' | 'cardNo' | 'joinDate' | 'seniority' | 'position' | 'status' | 'result' | 'prev' | 'next'> &
  Partial<Pick<ProposalRow, 'abc' | 'leave' | 'resignDate' | 'note' | 'boardDecision'>>;

const SEED: Seed[] = [
  { psk: 'p01', unit: 'Team A', name: 'XXXX', cardNo: 'VN10234', joinDate: '2017-06-02', seniority: 9.3, position: 'NV 職員', status: 'maternity', leave: { from: '2026-07-01', to: '2027-01-01' }, result: 'suspend', prev: 3_000_000, next: 0 },
  { psk: 'p02', unit: 'Team A', name: 'XYZA', cardNo: 'VN10318', joinDate: '2017-07-06', seniority: 9.2, position: 'PP 副課長', status: 'sickLeave', leave: { from: '2026-09-15', to: '2026-10-15' }, result: 'sick', prev: 2_000_000, next: 1_500_000 },
  { psk: 'p03', unit: 'Team B', name: 'ABCD', cardNo: 'VN11052', joinDate: '2018-09-05', seniority: 8.1, position: 'NV 職員', status: 'resigning', resignDate: '2026-10-05', result: 'cancel', prev: 1_000_000, next: 0 },
  { psk: 'p04', unit: 'Team B', name: 'HGTF', cardNo: 'VN11067', joinDate: '2018-09-11', seniority: 8.1, position: 'TBP 組長', status: 'contractSuspended', leave: { from: '2026-09-01', to: '2026-10-01' }, result: 'maintain', prev: 1_000_000, next: 1_000_000 },
  { psk: 'p05', unit: 'Team C', name: 'ASPD', cardNo: 'VN11120', joinDate: '2018-10-01', seniority: 8.0, position: 'NV 職員', abc: '1B, 2C', status: 'active', result: 'maintain', prev: 500_000, next: 500_000 },
  { psk: 'p06', unit: 'Team C', name: 'PLDM', cardNo: 'VN11245', joinDate: '2018-12-05', seniority: 7.8, position: 'NV 職員', abc: '1A, 2C', status: 'active', result: 'increase', prev: 500_000, next: 1_000_000 },
  { psk: 'p07', unit: 'Team D', name: 'KMND', cardNo: 'VN12031', joinDate: '2019-07-05', seniority: 7.2, position: 'TBP 組長', abc: '3C', status: 'active', result: 'reduce', prev: 1_000_000, next: 500_000 },
  { psk: 'p08', unit: 'Team E', name: 'BHTC', cardNo: 'VN12188', joinDate: '2019-09-16', seniority: 7.0, position: 'NV 職員', abc: '1A, 1B, 1C', status: 'active', result: 'increase', prev: 1_500_000, next: 2_000_000, boardDecision: 'Giữ nguyên 1,500,000' },
  { psk: 'p09', unit: 'Team E', name: 'AFTT', cardNo: 'VN18452', joinDate: '2026-05-12', seniority: 0.4, position: 'NV 職員', abc: '2B, 1C', status: 'active', result: 'increase', prev: 500_000, next: 1_000_000 },
  { psk: 'p10', unit: 'Team D', name: 'HTTK', cardNo: 'VN18517', joinDate: '2026-07-01', seniority: 0.3, position: 'NV 職員', abc: '3B', status: 'active', result: 'add', prev: 0, next: 500_000, note: 'New employee' },
  // Đã thôi việc: hệ thống nhân sự vẫn trả về nhưng không được hiển thị (lọc ở dưới).
  { psk: 'p11', unit: 'Team C', name: 'QWER', cardNo: 'VN13377', joinDate: '2020-03-02', seniority: 6.6, position: 'NV 職員', status: 'resigned', resignDate: '2026-08-31', result: 'cancel', prev: 500_000, next: 0 },
];

/** Toàn bộ dòng mẫu như hệ thống nhân sự trả về (kể cả người đã thôi việc). */
export const SAMPLE_ROWS: readonly ProposalRow[] = SEED.map((s) => ({
  abc: '',
  leave: null,
  resignDate: null,
  note: '',
  duties: '',
  boardDecision: null,
  ...s,
}));

/** Nhân viên được hiển thị: bỏ người đã thôi việc. */
export const isListed = (row: Pick<ProposalRow, 'status'>) => row.status !== 'resigned';

/**
 * Phạm vi của Chủ quản trong bản mẫu (theo email đăng nhập). Chủ quản không có trong bảng → không thấy bộ phận nào.
 * TODO: khi nối API, server phải tự lọc theo phạm vi do Admin gán (trang Phân quyền) và trả 403 khi vượt phạm vi —
 *       việc lọc ở client chỉ để hiển thị, không phải lớp bảo mật.
 */
const MANAGER_SCOPE: Record<string, string[]> = {
  'chuquan.dev@example.com': UNITS,
};

const unitsOf = (viewer: ProposalViewer) => (viewer.role === 'CQ' ? (MANAGER_SCOPE[viewer.email] ?? []) : UNITS);

// ───────── Lưu trữ của bản mẫu ─────────

type Stored = {
  edits: Record<string, ProposalEdit>;
  status: ProposalStatus;
  savedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
};
const STORE_KEY = `kpi-proposal-mock:v2:${PERIOD.id}`;
const EMPTY: Stored = { edits: {}, status: 'draft', savedAt: null, submittedAt: null, approvedAt: null };

const read = (): Stored => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...EMPTY, ...(JSON.parse(raw) as Partial<Stored>) };
  } catch {
    /* storage bị chặn hoặc dữ liệu hỏng: dùng dữ liệu gốc */
  }
  return EMPTY;
};

const write = (s: Stored) => {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* storage bị chặn: chỉ mất phần lưu của bản mẫu */
  }
};

/** Giả lập độ trễ mạng để trạng thái đang tải/đang lưu hiện ra như khi có API. */
const delay = <T>(value: T, ms = 250) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

/**
 * Giữ lại các ô vai trò được phép ghi ở trạng thái hiện tại, bỏ phần còn lại — mô phỏng việc server kiểm tra quyền theo cột.
 * TODO: server phải trả 403 (không âm thầm bỏ qua) khi nhận ô không được phép.
 */
const allowedEdits = (viewer: ProposalViewer, status: ProposalStatus, edits: Record<string, ProposalEdit>) =>
  Object.fromEntries(
    Object.entries(edits).map(([psk, edit]) => [
      psk,
      Object.fromEntries(Object.entries(edit).filter(([field]) => canEdit(viewer.role, status, field as EditableField))) as ProposalEdit,
    ])
  );

const mergeEdits = (stored: Stored, edits: Record<string, ProposalEdit>) => {
  const merged = { ...stored.edits };
  for (const [psk, edit] of Object.entries(edits)) merged[psk] = { ...merged[psk], ...edit };
  return merged;
};

export async function getKpiProposal(viewer: ProposalViewer): Promise<KpiProposal> {
  const { edits, ...state } = read();
  const units = unitsOf(viewer);
  const rows = SAMPLE_ROWS.filter((r) => isListed(r) && units.includes(r.unit)).map((r) => ({ ...r, ...edits[r.psk] }));
  return delay({ period: PERIOD, ...state, units: units.filter((u) => rows.some((r) => r.unit === u)), rows });
}

export async function saveKpiProposalDraft(viewer: ProposalViewer, edits: Record<string, ProposalEdit>): Promise<{ savedAt: string }> {
  const stored = read();
  const savedAt = new Date().toISOString();
  write({ ...stored, edits: mergeEdits(stored, allowedEdits(viewer, stored.status, edits)), savedAt });
  return delay({ savedAt });
}

/** CQ gửi đề xuất cho BLĐ. */
export async function submitKpiProposal(viewer: ProposalViewer, edits: Record<string, ProposalEdit>): Promise<{ submittedAt: string }> {
  const stored = read();
  if (stored.status !== 'draft') throw new Error('Proposal is not a draft');
  const submittedAt = new Date().toISOString();
  write({ ...stored, edits: mergeEdits(stored, allowedEdits(viewer, 'draft', edits)), status: 'submitted', savedAt: submittedAt, submittedAt });
  return delay({ submittedAt });
}

/** BLĐ phê duyệt (lưu kèm các ô Quyết định của BLĐ). */
export async function approveKpiProposal(viewer: ProposalViewer, edits: Record<string, ProposalEdit>): Promise<{ approvedAt: string }> {
  const stored = read();
  if (stored.status !== 'submitted') throw new Error('Proposal is not submitted');
  const approvedAt = new Date().toISOString();
  write({ ...stored, edits: mergeEdits(stored, allowedEdits(viewer, 'submitted', edits)), status: 'approved', savedAt: approvedAt, approvedAt });
  return delay({ approvedAt });
}

/** BLĐ trả lại cho CQ sửa (về trạng thái đang lập). */
export async function returnKpiProposal(viewer: ProposalViewer, edits: Record<string, ProposalEdit>): Promise<{ returnedAt: string }> {
  const stored = read();
  if (stored.status !== 'submitted') throw new Error('Proposal is not submitted');
  const returnedAt = new Date().toISOString();
  write({ ...stored, edits: mergeEdits(stored, allowedEdits(viewer, 'submitted', edits)), status: 'draft', submittedAt: null, savedAt: returnedAt });
  return delay({ returnedAt });
}
