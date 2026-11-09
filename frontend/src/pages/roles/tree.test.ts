import { describe, expect, it } from 'vitest';
import type { Unit } from './data';
import { flattenTree } from './tree';

const UNITS: Unit[] = [
  { id: 'tt', n: 'TRUNG TAM KHAI THAC MAU-樣品開發中心', k: [
    { id: 'tt1', n: 'Nhóm chuyển giao 1-轉移一組', c: 21 },
    { id: 'tt2', n: 'Nhóm chuyển giao 2-轉移二組', c: 18 },
  ] },
  { id: 'kt', n: 'PHONG KY THUAT-技術部', k: [{ id: 'kt1', n: 'Nhóm QC-品管組', c: 63 }] },
];
const ids = (rows: ReturnType<typeof flattenTree>) => rows.map((r) => r.unit.id);

describe('flattenTree', () => {
  it('tách tên và chữ Hán, chỉ mở nhánh đang mở', () => {
    const rows = flattenTree(UNITS, '', ['tt']);
    expect(ids(rows)).toEqual(['tt', 'tt1', 'tt2', 'kt']);
    expect(rows[1]).toMatchObject({ name: 'Nhóm chuyển giao 1', zh: '轉移一組', level: 1, count: 21 });
    expect(rows[0].count).toBe(39);
  });

  it('tìm không dấu hoặc chữ Hán; cha khớp thì hiện đủ con', () => {
    expect(ids(flattenTree(UNITS, 'qc', []))).toEqual(['kt', 'kt1']);
    expect(ids(flattenTree(UNITS, '品管', []))).toEqual(['kt', 'kt1']);
    expect(ids(flattenTree(UNITS, 'trung tam', []))).toEqual(['tt', 'tt1', 'tt2']);
  });

  it('keep: chỉ giữ nhóm được lọc, mở sẵn và bỏ cha không còn nhóm', () => {
    expect(ids(flattenTree(UNITS, '', [], (l) => l.id === 'tt2'))).toEqual(['tt', 'tt2']);
  });
});
