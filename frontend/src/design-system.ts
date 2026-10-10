/**
 * Entry của thư viện design system (dùng cho `npm run build:lib` và /design-sync).
 * Chỉ export thành phần dùng chung trong components/ui — không kéo theo router, auth hay API.
 */
import './design-system.css';

export { Badge, badgeVariants, BADGE_STATUS } from '@/components/ui/badge';
export type { BadgeStatus } from '@/components/ui/badge';
export { Button, buttonVariants } from '@/components/ui/button';
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
export { Checkbox } from '@/components/ui/checkbox';
export { FormAlert } from '@/components/ui/form-alert';
export type { FormAlertTone } from '@/components/ui/form-alert';
export { GlassCard, glassCardVariants } from '@/components/ui/glass-card';
export { Input } from '@/components/ui/input';
export type { InputProps } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { ProgressBar, KPI_THRESHOLDS, getKpiTone } from '@/components/ui/progress-bar';
export type { KpiTone } from '@/components/ui/progress-bar';
export { StatCard } from '@/components/ui/stat-card';
export type { StatTrend } from '@/components/ui/stat-card';
export { Toaster, toast } from '@/components/ui/toast';
export { cn } from '@/lib/utils';
