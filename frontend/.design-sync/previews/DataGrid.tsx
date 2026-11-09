import * as React from 'react';
import { DataGrid, Pill, TableCard, TableCardBody, type DataGridColumn, type DataGridGroup } from 'frontend';

type Proposal = { id: string; unit: string; name: string; result: string; previous: number; current: number };

const money = (n: number) => (n < 0 ? `(${Math.abs(n).toLocaleString('en-US')})` : n.toLocaleString('en-US'));

const PROPOSALS: Proposal[] = [
  { id: '1', unit: 'BHTC', name: 'Nguyen Van An', result: 'Increase', previous: 1_500_000, current: 2_000_000 },
  { id: '2', unit: 'PLDM', name: 'Tran Thi Binh', result: 'Keep', previous: 1_000_000, current: 1_000_000 },
  { id: '3', unit: 'XYZ', name: 'Ly Van Cuong', result: 'Reduce', previous: 2_000_000, current: 1_000_000 },
  { id: '4', unit: 'BHTC', name: 'Pham Thi Dung', result: 'Increase', previous: 800_000, current: 1_200_000 },
];
const sum = (k: 'previous' | 'current') => PROPOSALS.reduce((s, r) => s + r[k], 0);

/** Wide table: pinned leading columns, a sticky footer (total) row, a left accent stripe per row. */
export const PinnedWithTotal = () => {
  const columns: DataGridColumn<Proposal>[] = [
    { key: 'unit', header: 'Unit', sub: '單位', width: 72, pinned: true, cell: (r) => r.unit },
    { key: 'name', header: 'Full name', width: 160, pinned: true, cell: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'result', header: 'Evaluation result', sub: '審核結果', width: 'minmax(140px,1fr)', cell: (r) => r.result },
    { key: 'previous', header: 'Previous period', width: 130, align: 'end', cell: (r) => money(r.previous), footer: money(sum('previous')) },
    { key: 'current', header: 'This period', width: 130, align: 'end', tone: 'input', cell: (r) => money(r.current), footer: money(sum('current')) },
    {
      key: 'diff',
      header: 'Difference',
      width: 130,
      align: 'end',
      cellClassName: (r) => (r.current < r.previous ? 'text-danger-text' : undefined),
      cell: (r) => money(r.current - r.previous),
      footer: <span className={sum('current') < sum('previous') ? 'text-danger-text' : undefined}>{money(sum('current') - sum('previous'))}</span>,
    },
  ];
  return (
    <TableCard style={{ height: 300 }}>
      <TableCardBody className="flex flex-col">
        <DataGrid
          aria-label="KPI proposals"
          columns={columns}
          rows={PROPOSALS}
          rowKey={(r) => r.id}
          striped
          rowAccent={(r) => (r.result === 'Reduce' ? 'bg-danger-text' : r.result === 'Increase' ? 'bg-info' : 'bg-muted-foreground')}
          footerLabel="Total"
        />
      </TableCardBody>
    </TableCard>
  );
};

type Salary = { id: string; name: string; contract: number; rating: number; attendance: number; newRating: number; newAttendance: number; opinion: string };
const SALARY: Salary[] = [
  { id: '1', name: 'Nguyen Van An', contract: 10_120_000, rating: 500_000, attendance: 300_000, newRating: 500_000, newAttendance: 300_000, opinion: 'Eligible, effective on return' },
  { id: '2', name: 'Tran Thi Binh', contract: 7_200_000, rating: 400_000, attendance: 300_000, newRating: 450_000, newAttendance: 300_000, opinion: 'Agree with the proposal' },
  { id: '3', name: 'Ly Van Cuong', contract: 6_500_000, rating: 300_000, attendance: 300_000, newRating: 300_000, newAttendance: 300_000, opinion: 'Not eligible: 4C in 12 months' },
];

/**
 * Column groups (28px, one line) with a second tier of subgroups over repeated column names,
 * and collapsible groups: a collapsed group becomes a 40px column with a vertical label.
 */
export const GroupsSubgroupsCollapse = () => {
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set(['hr']));
  const toggle = (k: string) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (!next.delete(k)) next.add(k);
      return next;
    });
  const m = (v: number) => money(v);
  const columns: DataGridColumn<Salary>[] = [
    { key: 'name', header: 'Nominee', sub: '提名幹部', width: 150, pinned: true, cell: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { key: 'contract', header: 'Contract salary', sub: '目前合約薪資', width: 120, align: 'end', tone: 'salary', cell: (r) => m(r.contract) },
    { key: 'rating', header: 'Rating bonus', sub: '評等獎金', width: 104, align: 'end', tone: 'salary', cell: (r) => m(r.rating) },
    { key: 'attendance', header: 'Attendance bonus', sub: '全勤獎金', width: 112, align: 'end', tone: 'salary', cell: (r) => m(r.attendance) },
    { key: 'newRating', header: 'Rating bonus', sub: '評等獎金', width: 104, align: 'end', tone: 'salary', cell: (r) => m(r.newRating) },
    { key: 'newAttendance', header: 'Attendance bonus', sub: '全勤獎金', width: 112, align: 'end', tone: 'salary', cell: (r) => m(r.newAttendance) },
    { key: 'opinion', header: 'HR opinion', sub: '人力資源的意見', width: 'minmax(200px,1fr)', tone: 'success', divider: 'start', cell: (r) => r.opinion },
  ];
  const label = (vi: string, zh: string) => (
    <>
      <span style={{ fontWeight: 600, fontSize: 11 }}>{vi}</span>
      <span className="text-muted-foreground" style={{ fontSize: 10.5, fontWeight: 400 }}>
        {zh}
      </span>
    </>
  );
  const group = (key: string, span: number, tone: DataGridGroup['tone'], marker: DataGridGroup['marker'], name: string, zh: string): DataGridGroup => ({
    key,
    span,
    tone,
    marker,
    label: label(name, zh),
    collapse: {
      collapsed: collapsed.has(key),
      onToggle: () => toggle(key),
      label: `${collapsed.has(key) ? 'Expand' : 'Collapse'} group: ${name}`,
      stub: (
        <>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span className="text-muted-foreground">{span} cols</span>
        </>
      ),
    },
  });
  const groups: DataGridGroup[] = [
    { key: 'who', span: 1, tone: 'read', marker: 'muted', label: label('Employee', '人事') },
    {
      ...group('salary', 5, 'salary', 'warning', 'Salary system', '薪資系統'),
      subgroups: [
        { key: 'current', from: 'rating', span: 2, label: 'Current 目前' },
        { key: 'after', from: 'newRating', span: 2, label: 'After the raise 調整後' },
      ],
    },
    group('hr', 1, 'success', 'success', 'HR opinion', 'HR 意見'),
  ];
  return (
    <TableCard style={{ height: 300 }}>
      <TableCardBody className="flex flex-col">
        <DataGrid aria-label="Salary proposal" columns={columns} groups={groups} rows={SALARY} rowKey={(r) => r.id} striped wrapHeaders />
      </TableCardBody>
    </TableCard>
  );
};

type Person = { id: string; name: string; zh: string; unit: string; role: 'Manager' | 'Unassigned'; scope: string };
const PEOPLE: Person[] = [
  { id: '1', name: 'Nguyen Van An', zh: '阮文安', unit: 'Transfer team', role: 'Manager', scope: '3 teams' },
  { id: '2', name: 'Tran Thi Binh', zh: '陳氏平', unit: 'Transfer team', role: 'Unassigned', scope: '—' },
  { id: '3', name: 'Le Van Cuong', zh: '黎文強', unit: 'IT Hardware', role: 'Unassigned', scope: '—' },
];

/** `density="comfortable"`: few columns filling the width (48px header, 56px rows), whole-row hover. */
export const Comfortable = () => {
  const columns: DataGridColumn<Person>[] = [
    {
      key: 'name',
      header: 'Employee',
      width: 'minmax(0,26fr)',
      cell: (r) => (
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          <span className="text-muted-foreground" style={{ fontSize: 12 }}>
            {r.zh}
          </span>
        </span>
      ),
    },
    { key: 'unit', header: 'Unit', width: 'minmax(0,18fr)', cell: (r) => r.unit },
    { key: 'role', header: 'Role', width: 'minmax(0,15fr)', cell: (r) => <Pill tone={r.role === 'Manager' ? 'brand' : 'warning'}>{r.role}</Pill> },
    { key: 'scope', header: 'Scope', width: 'minmax(0,14fr)', cell: (r) => r.scope },
  ];
  return (
    <TableCard style={{ height: 260 }}>
      <TableCardBody className="flex flex-col">
        <DataGrid aria-label="Permissions" columns={columns} rows={PEOPLE} rowKey={(r) => r.id} density="comfortable" striped hoverRows />
      </TableCardBody>
    </TableCard>
  );
};
