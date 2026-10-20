import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from '@/lib/session';
import {
  approveKpiProposal,
  getKpiProposal,
  returnKpiProposal,
  saveKpiProposalDraft,
  submitKpiProposal,
  type ProposalEdit,
  type ProposalViewer,
} from '@/services/kpiProposal';

const proposalKey = ['kpi-proposal', 'current'] as const;

/** Đề xuất KPI kỳ hiện tại của người đang đăng nhập (đã lọc theo phạm vi). */
export function useKpiProposal() {
  const { role, email } = useCurrentUser();
  return useQuery({ queryKey: [...proposalKey, role, email], queryFn: () => getKpiProposal({ role, email }) });
}

type Action = (viewer: ProposalViewer, edits: Record<string, ProposalEdit>) => Promise<unknown>;

/** Một thao tác ghi (lưu nháp / gửi / duyệt / trả lại): xong thì tải lại đề xuất. */
function useProposalAction(action: Action) {
  const qc = useQueryClient();
  const { role, email } = useCurrentUser();
  return useMutation({
    mutationFn: (edits: Record<string, ProposalEdit>) => action({ role, email }, edits),
    onSuccess: () => qc.invalidateQueries({ queryKey: proposalKey }),
  });
}

export const useSaveKpiProposalDraft = () => useProposalAction(saveKpiProposalDraft);
export const useSubmitKpiProposal = () => useProposalAction(submitKpiProposal);
export const useApproveKpiProposal = () => useProposalAction(approveKpiProposal);
export const useReturnKpiProposal = () => useProposalAction(returnKpiProposal);
