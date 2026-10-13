/**
 * Entry của thư viện design system (dùng cho `npm run build:lib` và /design-sync).
 * Chỉ export thành phần dùng chung trong components/ui — không kéo theo router, auth hay API.
 */
import './design-system.css';

export { Badge, badgeVariants, BADGE_STATUS } from '@/components/ui/badge';
export type { BadgeStatus } from '@/components/ui/badge';
export { Button, buttonVariants } from '@/components/ui/button';
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
export { AnnouncementCard } from '@/components/ui/announcement-card';
export type { AnnouncementCardProps } from '@/components/ui/announcement-card';
export { Checkbox } from '@/components/ui/checkbox';
export { ClockCard } from '@/components/ui/clock-card';
export type { ClockCardProps } from '@/components/ui/clock-card';
export { CountdownCard } from '@/components/ui/countdown-card';
export type { CountdownCardProps } from '@/components/ui/countdown-card';
export { FormAlert } from '@/components/ui/form-alert';
export type { FormAlertTone } from '@/components/ui/form-alert';
export { GlassCard, glassCardVariants } from '@/components/ui/glass-card';
export { InfoCard } from '@/components/ui/info-card';
export type { InfoCardProps } from '@/components/ui/info-card';
export { Input } from '@/components/ui/input';
export type { InputProps } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { PageBanner } from '@/components/ui/page-banner';
export type { PageBannerBadge, PageBannerProps } from '@/components/ui/page-banner';
export { Popover,PopoverClose, PopoverContent, PopoverTrigger, onListKeyDown } from '@/components/ui/popover';
export { PageShell, TableCard, TableCardBar, TableCardBody } from '@/components/ui/table-page';
export { ProgressBar, KPI_THRESHOLDS, getKpiTone } from '@/components/ui/progress-bar';
export type { KpiTone } from '@/components/ui/progress-bar';
export { QuarterProgress } from '@/components/ui/quarter-progress';
export type { QuarterProgressProps } from '@/components/ui/quarter-progress';
export { StatCard } from '@/components/ui/stat-card';
export type { StatTrend } from '@/components/ui/stat-card';
export { UpdatesList } from '@/components/ui/updates-list';
export type { UpdatesListItem, UpdatesListProps, UpdateTone } from '@/components/ui/updates-list';
export { Toaster, toast } from '@/components/ui/toast';
export { cn } from '@/lib/utils';
