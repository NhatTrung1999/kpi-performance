import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/session';
import {
  getKpiProposal,
  saveKpiProposalDraft,
  submitKpiProposal,
  type KpiProposal,
  type ProposalEdit,
} from '@/services/kpiProposal';

const proposalKey = (role: string, email: string) => ['kpi-proposal', 'current', role, email] as const;

/** Đề xuất KPI kỳ hiện tại của người đang đăng nhập (đã lọc theo phạm vi). */
export function useKpiProposal() {
  const { role, email } = useCurrentUser();
  return useQuery({ queryKey: proposalKey(role, email), queryFn: () => getKpiProposal({ role, email }) });
}

/** Gộp phần đã sửa vào dữ liệu trong cache để bảng không nhảy về giá trị cũ khi bỏ bản nháp cục bộ. */
const merge = (data: KpiProposal | undefined, edits: Record<string, ProposalEdit>, patch: Partial<KpiProposal>) =>
  data && { ...data, ...patch, rows: data.rows.map((r) => ({ ...r, ...edits[r.psk] })) };

export function useSaveKpiProposalDraft() {
  const qc = useQueryClient();
  const { role, email } = useCurrentUser();
  return useMutation({
    mutationFn: (edits: Record<string, ProposalEdit>) => saveKpiProposalDraft(edits),
    onSuccess: ({ savedAt }, edits) =>
      qc.setQueryData<KpiProposal>(proposalKey(role, email), (d) => merge(d, edits, { savedAt })),
  });
}

export function useSubmitKpiProposal() {
  const qc = useQueryClient();
  const { role, email } = useCurrentUser();
  return useMutation({
    mutationFn: (edits: Record<string, ProposalEdit>) => submitKpiProposal(edits),
    onSuccess: ({ submittedAt }, edits) =>
      qc.setQueryData<KpiProposal>(proposalKey(role, email), (d) =>
        merge(d, edits, { status: 'submitted', submittedAt, savedAt: submittedAt })
      ),
  });
}
