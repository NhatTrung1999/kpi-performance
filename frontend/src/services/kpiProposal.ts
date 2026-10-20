/**
 * Dữ liệu trang Đề xuất KPI — hiện là DỮ LIỆU MẪU, chưa gọi API.
 * Khi backend có endpoint, thay thân các hàm bằng `http.*` (lib/axios.ts) và giữ nguyên kiểu:
 *   getKpiProposal       → GET  /kpi-proposals/current
 *   saveKpiProposalDraft → PUT  /kpi-proposals/current/draft
 *   submitKpiProposal    → POST /kpi-proposals/current/submit
 * Bản mẫu lưu nháp/trạng thái gửi vào localStorage (dùng chung cho mọi tài khoản trên máy) để còn sau khi tải lại trang.
 * Tên bộ phận, họ tên, chức vụ là dữ liệu hệ thống nên hiển thị nguyên văn. Ngày lưu ISO `YYYY-MM-DD`.
 */
import type { ProposalResult } from '@/config/kpi-proposal';
import type { AppRole } from '@/lib/session';

/** Tình trạng nhân viên lấy từ hệ thống nhân sự. `resigned` (đã thôi việc) không bao giờ hiển thị. */
export type EmployeeStatus = 'active' | 'maternity' | 'sickLeave' | 'resigning' | 'contractSuspended' | 'resigned';

/** Phần Chủ quản nhập trên mỗi dòng. */
export type ProposalEdit = {
  /** Công việc đang phụ trách & hiệu suất. */
  duties: string;
  result: ProposalResult;
  /** Số tiền KPI kỳ này; `null` = chưa nhập. */
  next: number | null;
  note: string;
};

export type ProposalRow = ProposalEdit & {
  /** Khóa nhân viên (Person_Serial_Key). */
  psk: string;
  unit: string;
  name: string;
  cardNo: string;
  joinDate: string;
  /** Thâm niên (năm). */
  seniority: number;
  position: string;
  /** Bình bầu A-B-C trong 3 tháng gần nhất (số lần mỗi loại). */
  abc: { A: number; B: number; C: number };
  status: EmployeeStatus;
  /** Thời gian nghỉ ốm / thai sản / tạm hoãn hợp đồng. */
  leave: { from: string; to: string } | null;
  resignDate: string | null;
  /** Số tiền KPI kỳ trước (lấy từ hệ thống). */
  prev: number;
  /** Quyết định của BLĐ — chỉ BLĐ cập nhật. */
  boardDecision: string | null;
};

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

export type ProposalStatus = 'draft' | 'submitted';

export type KpiProposal = {
  period: ProposalPeriod;
  status: ProposalStatus;
  /** ISO datetime lần lưu nháp gần nhất. */
  savedAt: string | null;
  submittedAt: string | null;
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

type Seed = Omit<ProposalRow, 'duties' | 'boardDecision' | 'cardNo' | 'abc' | 'leave' | 'resignDate' | 'note'> & {
  abc?: Partial<ProposalRow['abc']>;
  leave?: ProposalRow['leave'];
  resignDate?: string;
  note?: string;
};

const SEED: Seed[] = [
  { psk: 'p01', unit: 'Team A', name: 'XXXX', joinDate: '2017-06-02', seniority: 9.3, position: 'NV 職員', status: 'maternity', leave: { from: '2026-07-01', to: '2027-01-01' }, result: 'suspend', prev: 3_000_000, next: 0 },
  { psk: 'p02', unit: 'Team A', name: 'XYZA', joinDate: '2017-07-06', seniority: 9.2, position: 'PP 副課長', status: 'sickLeave', leave: { from: '2026-09-15', to: '2026-10-15' }, result: 'sick', prev: 2_000_000, next: 1_500_000 },
  { psk: 'p03', unit: 'Team B', name: 'ABCD', joinDate: '2018-09-05', seniority: 8.1, position: 'NV 職員', status: 'resigning', resignDate: '2026-10-05', result: 'cancel', prev: 1_000_000, next: 0 },
  { psk: 'p04', unit: 'Team B', name: 'HGTF', joinDate: '2018-09-11', seniority: 8.1, position: 'TBP 組長', status: 'contractSuspended', leave: { from: '2026-09-01', to: '2026-10-01' }, result: 'maintain', prev: 1_000_000, next: 1_000_000 },
  { psk: 'p05', unit: 'Team C', name: 'ASPD', joinDate: '2018-10-01', seniority: 8.0, position: 'NV 職員', abc: { B: 1, C: 2 }, status: 'active', result: 'maintain', prev: 500_000, next: 500_000 },
  { psk: 'p06', unit: 'Team C', name: 'PLDM', joinDate: '2018-12-05', seniority: 7.8, position: 'NV 職員', abc: { A: 1, C: 2 }, status: 'active', result: 'increase', prev: 500_000, next: 1_000_000 },
  { psk: 'p07', unit: 'Team D', name: 'KMND', joinDate: '2019-07-05', seniority: 7.2, position: 'TBP 組長', abc: { C: 3 }, status: 'active', result: 'reduce', prev: 1_000_000, next: 500_000 },
  { psk: 'p08', unit: 'Team E', name: 'BHTC', joinDate: '2019-09-16', seniority: 7.0, position: 'NV 職員', abc: { A: 1, B: 1, C: 1 }, status: 'active', result: 'increase', prev: 1_500_000, next: 2_000_000 },
  { psk: 'p09', unit: 'Team E', name: 'AFTT', joinDate: '2026-05-12', seniority: 0.4, position: 'NV 職員', abc: { B: 2, C: 1 }, status: 'active', result: 'increase', prev: 500_000, next: 1_000_000 },
  { psk: 'p10', unit: 'Team D', name: 'HTTK', joinDate: '2026-07-01', seniority: 0.3, position: 'NV 職員', abc: { B: 3 }, status: 'active', result: 'add', prev: 0, next: 500_000, note: 'New employee' },
  // Đã thôi việc: hệ thống nhân sự vẫn trả về nhưng không được hiển thị (lọc ở dưới).
  { psk: 'p11', unit: 'Team C', name: 'QWER', joinDate: '2020-03-02', seniority: 6.6, position: 'NV 職員', status: 'resigned', resignDate: '2026-08-31', result: 'cancel', prev: 500_000, next: 0 },
];

const BASE_ROWS: ProposalRow[] = SEED.map((s) => ({
  ...s,
  cardNo: '',
  abc: { A: 0, B: 0, C: 0, ...s.abc },
  leave: s.leave ?? null,
  resignDate: s.resignDate ?? null,
  note: s.note ?? '',
  duties: '',
  boardDecision: null,
}));

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

type Stored = { edits: Record<string, ProposalEdit>; savedAt: string | null; submittedAt: string | null };
const STORE_KEY = `kpi-proposal-mock:${PERIOD.id}`;

const read = (): Stored => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* storage bị chặn hoặc dữ liệu hỏng: dùng dữ liệu gốc */
  }
  return { edits: {}, savedAt: null, submittedAt: null };
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

export async function getKpiProposal(viewer: ProposalViewer): Promise<KpiProposal> {
  const stored = read();
  const units = unitsOf(viewer);
  const rows = BASE_ROWS.filter((r) => r.status !== 'resigned' && units.includes(r.unit)).map((r) => ({ ...r, ...stored.edits[r.psk] }));
  return delay({
    period: PERIOD,
    status: stored.submittedAt ? 'submitted' : 'draft',
    savedAt: stored.savedAt,
    submittedAt: stored.submittedAt,
    units: units.filter((u) => rows.some((r) => r.unit === u)),
    rows,
  });
}

export async function saveKpiProposalDraft(edits: Record<string, ProposalEdit>): Promise<{ savedAt: string }> {
  const stored = read();
  if (stored.submittedAt) throw new Error('Proposal already submitted');
  const savedAt = new Date().toISOString();
  write({ ...stored, edits: { ...stored.edits, ...edits }, savedAt });
  return delay({ savedAt });
}

export async function submitKpiProposal(edits: Record<string, ProposalEdit>): Promise<{ submittedAt: string }> {
  const stored = read();
  const submittedAt = new Date().toISOString();
  write({ edits: { ...stored.edits, ...edits }, savedAt: submittedAt, submittedAt });
  return delay({ submittedAt });
}
