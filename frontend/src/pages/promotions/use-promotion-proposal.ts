import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrgChartSlot } from '@/config/promotion-proposal';
import { useCurrentUser } from '@/lib/session';
import {
  approvePromotionProposal,
  getPromotionProposal,
  removeOrgChart,
  returnPromotionProposal,
  savePromotionDraft,
  submitPromotionProposal,
  uploadOrgChart,
  type PromotionEdit,
  type PromotionViewer,
} from '@/services/promotionProposal';

const promotionKey = ['promotion-proposal', 'current'] as const;

/** Đề xuất thăng chức & lương của nhóm đang chọn (`null` = nhóm mặc định theo vai trò), đã lọc theo vai trò. */
export function usePromotionProposal(groupId: string | null) {
  const { role, email } = useCurrentUser();
  return useQuery({
    queryKey: [...promotionKey, role, email, groupId],
    queryFn: () => getPromotionProposal({ role, email }, groupId),
    placeholderData: keepPreviousData,
  });
}

/** Thao tác ghi trên một nhóm: xong thì tải lại đề xuất. */
function useGroupAction<V>(action: (viewer: PromotionViewer, groupId: string, vars: V) => Promise<unknown>) {
  const qc = useQueryClient();
  const { role, email } = useCurrentUser();
  return useMutation({
    mutationFn: ({ groupId, ...vars }: { groupId: string } & V) => action({ role, email }, groupId, vars as V),
    onSuccess: () => qc.invalidateQueries({ queryKey: promotionKey }),
  });
}

type Edits = { edits: Record<string, PromotionEdit> };

export const useSavePromotionDraft = () => useGroupAction<Edits>((v, g, { edits }) => savePromotionDraft(v, g, edits));
export const useSubmitPromotion = () => useGroupAction<Edits>((v, g, { edits }) => submitPromotionProposal(v, g, edits));
export const useApprovePromotion = () => useGroupAction<Edits>((v, g, { edits }) => approvePromotionProposal(v, g, edits));
export const useReturnPromotion = () =>
  useGroupAction<Edits & { reason: string }>((v, g, { edits, reason }) => returnPromotionProposal(v, g, reason, edits));
export const useUploadOrgChart = () =>
  useGroupAction<{ slot: OrgChartSlot; file: File }>((v, g, { slot, file }) => uploadOrgChart(v, g, slot, file));
export const useRemoveOrgChart = () => useGroupAction<{ slot: OrgChartSlot }>((v, g, { slot }) => removeOrgChart(v, g, slot));
