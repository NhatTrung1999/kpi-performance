# Design system — KPI Performance

Nguồn sự thật của token: `frontend/src/index.css` (Tailwind v4, khối `:root`, `.dark` và `@theme inline`).
Component dùng chung: `frontend/src/components/ui/`. Entry thư viện: `frontend/src/design-system.ts` (`npm run build:lib` → `frontend/dist-lib/`).

Phong cách: **phẳng "soft blue"** — nền xanh lam rất nhạt có quầng sáng (`.flat-backdrop`), thẻ trắng bo tròn lớn (khung bảng/thẻ thông tin 22px) viền gần như vô hình, đổ bóng xanh mềm, điểm nhấn gradient xanh trời → xanh dương, ô icon/chip nền `accent` xanh nhạt. Không còn kính mờ ở trang trong lẫn trang đăng nhập.

Dark mode: class `dark` trên `<html>` (xem `src/lib/theme.ts`, nút `ThemeToggle` ở thanh trên và trang đăng nhập) — tông navy xanh cùng họ màu. Mọi token bên dưới tự đổi giá trị, **không cần** viết `dark:` khi dùng token.

## Nguyên tắc

| | Trang đăng nhập | Trang bên trong |
|---|---|---|
| Mục đích | Tạo ấn tượng thương hiệu | Đọc số liệu nhanh, ít mỏi mắt |
| Hiệu ứng | Nền `.flat-backdrop` (quầng sáng xanh mềm), thẻ trắng bo tròn lớn, animation vào trang (`animate-card-in`, `animate-form-in`); không kính mờ | **Tiết chế**: nền `.flat-backdrop`, `Card` thường, không blur, không animation trang trí |
| Màu | Gradient thương hiệu, glow | Màu thương hiệu chỉ cho hành động chính; xanh/vàng/đỏ **chỉ** để chỉ trạng thái |
| Số liệu | — | Luôn `tabular-nums`, số lớn hơn nhãn, đơn vị nhỏ và nhạt |

Quy tắc chung:
1. Trạng thái không chỉ dựa vào màu: luôn kèm icon hoặc chữ (`Badge`, `StatCard` có mũi tên + chữ ẩn "Tăng/Giảm").
2. Dùng token, không viết hex/`indigo-600` trực tiếp trong component. Ngoại lệ có chủ đích: nền mesh và glow của trang đăng nhập (`Login.tsx`, `growth-line.tsx`).
3. Tôn trọng `prefers-reduced-motion` (đã xử lý ở `index.css`).
4. Khoảng cách theo bội số 4px (Tailwind `--spacing: 0.25rem`): `p-1`=4, `p-2`=8, `p-4`=16, `gap-6`=24.

## Token

### Màu thương hiệu
| Token | Class | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| `--brand` | `bg-brand`, `ring-brand` | `#3B82F6` | `#60A5FA` | focus ring, điểm nhấn |
| `--brand-from` → `--brand-to` | `bg-brand-gradient` | `#38A3FF` → `#2B5CEB` (xanh trời → xanh dương) | giữ nguyên | nút chính, checkbox, logo |
| `--brand-text` | `text-brand-text` | `#2563EB` | `#7DB4FF` | liên kết |
| `--info` | `text-info` | `#3B82F6` | `#60A5FA` | màu phụ (xanh dương) |
| `--primary` | `bg-primary` | `#2F6BF2` | `#2F6BF2` | token shadcn mặc định |

### Trạng thái
| Ý nghĩa | Fill (`bg-*`) | Nền nhạt | Chữ (`text-*`) |
|---|---|---|---|
| Đạt | `success` `#10B981` | `success-soft` `#ECFDF5` / tối `rgb(16 185 129 / .1)` | `success-text` `#047857` / tối `#6EE7B7` |
| Cảnh báo | `warning` `#F59E0B` | `warning-soft` `#FFFBEB` / tối `rgb(251 191 36 / .12)` | `warning-text` `#B45309` / tối `#FCD34D` |
| Chưa đạt / Lỗi | `danger` `#EF4444` | `danger-soft` `#FEF2F2` / tối `rgb(248 113 113 / .07)` | `danger-text` `#DC2626` / tối `#F87171` |

`danger-strong` (`#B91C1C` / `#FCA5A5`) dùng cho tiêu đề trong `FormAlert`; `danger-border` cho viền.

### Nền, chữ, viền
| Token | Class | Sáng | Tối |
|---|---|---|---|
| `--page` / `--background` | `bg-page`, `bg-background` | `#EDF2FD` (xanh lam rất nhạt) | `#0A1020` (navy) |
| `--shell` | `bg-shell` | `#070B14` | `#070B14` |
| `--panel` | `bg-panel` | `rgb(255 255 255 / .03)` | `rgb(255 255 255 / .03)` (chỉ còn trong mã kính cũ) |
| `--scrollbar-thumb` / `--scrollbar-thumb-hover` | (CSS chung, không có class) | `#C9D6EE` / `#64748B` | `rgb(148 163 184 / .3)` / `rgb(255 255 255 / .35)` |
| `--card` | `bg-card` | `#FFFFFF` | `#111A2E` |
| `--foreground` | `text-foreground` | `#0F172A` | `#E8EEF9` |
| `--text-secondary` | `text-text-secondary` | `#334155` | `#C3CEE3` |
| `--muted-foreground` | `text-muted-foreground` | `#64748B` | `#8A9BBA` |
| `--placeholder` | `text-placeholder` | `#94A3B8` | `#64748B` |
| `--border` | `border-border` | `#E2E9F6` | `rgb(148 163 184 / .16)` |
| `--accent` / `--accent-foreground` | `bg-accent`, `text-accent-foreground` | `#E8F1FF` / `#1D4ED8` | `rgb(59 130 246 / .16)` / `#A9CCFF` |
| `--border-strong` | `border-border-strong` | `#C9D6EE` | `rgb(148 163 184 / .3)` |
| `--glass`, `--glass-border` | `bg-glass`, `border-glass-border` | `rgb(255 255 255 / .75)`, `/ .8` | `rgb(16 16 24 / .7)`, `rgb(255 255 255 / .1)` |

### Bảng dữ liệu (`DataGrid`)
Mọi token dưới đây là màu **đục** (hex đã pha sẵn trên `card`) vì nằm trên ô dính (sticky): nội dung cuộn qua không được lộ ra. Không dùng `color-mix()` trong `:root`/`.dark`.

| Token | Class | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| `--grid-group-read` / `--grid-head-read` | `bg-grid-group-read` / `bg-grid-head-read` | `#F4F7FC` / `#FAFBFE` | `#172036` / `#141D31` | nhóm cột chỉ đọc (tông `read`) |
| `--grid-group-input` / `--grid-head-input` | `bg-grid-group-input` / `bg-grid-head-input` | `#EAF2FF` / `#F5F9FF` | `#16264A` / `#142140` | nhóm cột nhập liệu (tông `input`) |
| `--grid-group-warn` / `--grid-head-warn` | `bg-grid-group-warn` / `bg-grid-head-warn` | `#FEF3D6` / `#FFFAEB` | `#2C261D` / `#231F1C` | tông `warn` (vd. CQ tự điền) |
| `--grid-group-info` / `--grid-head-info` | `bg-grid-group-info` / `bg-grid-head-info` | `#E3EEFE` / `#F2F7FF` | `#182A4D` / `#142242` | tông `info` (vd. hệ thống KPI, BLĐ) |
| `--grid-group-salary` / `--grid-head-salary` | `bg-grid-group-salary` / `bg-grid-head-salary` | `#FCEBB6` / `#FEF5DA` | `#3A301D` / `#2A241D` | tông `salary` (các cột lương tô vàng) |
| `--grid-group-success` / `--grid-head-success` | `bg-grid-group-success` / `bg-grid-head-success` | `#E3F6EC` / `#F2FBF6` | `#142928` / `#151F22` | tông `success` (vd. ý kiến nhân sự) |
| `--grid-locked` | `bg-grid-locked` | `#F3F6FB` | `#161F34` | cột chỉ người khác cập nhật |
| `--grid-row-alt` | `bg-grid-row-alt` | `#FAFCFF` | `#131C31` | dòng xen kẽ (`striped`) |
| `--grid-row-hover` | `bg-grid-row-hover` | `#EFF5FF` | `#17264A` | dòng đang rê chuột (`hoverRows`) |
| `--grid-row-muted` | `bg-grid-row-muted` | `var(--muted)` | `#1A2338` | dòng làm mờ |
| `--grid-row-danger` | `bg-grid-row-danger` | `#FEF4F4` | `#2C1E24` | dòng bị từ chối |

Thanh cuộn: toàn hệ thống dùng thanh mảnh (Firefox `scrollbar-width: thin`, Chrome/Edge `::-webkit-scrollbar` 8px, con trượt bo tròn ~4px) khai báo một lần trong `index.css`; không tự đặt kiểu thanh cuộn trong component.

### Font & cỡ chữ
Font: **Be Vietnam Pro** (400/500/600/700/800; subset vietnamese, latin-ext, latin; tự host qua `@fontsource`, khai báo trong `src/fonts.css`). `font-sans` và `font-login` đều là Be Vietnam Pro.

| Class | Cỡ | Dùng cho |
|---|---|---|
| `text-xs` | 12px | badge, chú thích |
| `text-label` | 13px | thông báo lỗi, mô tả phụ |
| `text-sm` | 14px | nhãn, nội dung thường |
| `text-body` | 15px | ô nhập, nút lớn |
| `text-base` | 16px | |
| `text-title` | 30px | tiêu đề form |
| `text-3xl` | 30px | số lớn của `StatCard` |

### Bo góc
| Class | px | |
|---|---|---|
| `rounded-md` | 8 | nút nhỏ, ô nhập mặc định |
| `rounded-lg` | 12 | nút, input |
| `rounded-xl` | 16 | card |
| `rounded-2xl` | 20 | |
| `rounded-control` | 14 | **riêng trang đăng nhập**: ô nhập lớn, nút lớn, khung cảnh báo, toast |
| `rounded-hero` | 28 | **riêng trang đăng nhập**: thẻ kính |

### Đổ bóng
`shadow-glass`, `shadow-glass-sm` (kính mờ), `shadow-brand`, `shadow-brand-hover` (nút gradient), `shadow-field` (ô nhập), `shadow-toast`, `shadow-card` (thẻ `Card variant="raised"`), `shadow-panel` (tấm nội dung của `AppShell`), `shadow-nav` (mục sidebar đang chọn), `shadow-grid-footer` (trên dòng tổng `DataGrid` khi còn dòng bị che), `shadow-grid-pin` (mép phải các cột cố định của `DataGrid` khi đã cuộn ngang). Giá trị đổi theo sáng/tối trong `index.css`. Trang bên trong: ưu tiên không đổ bóng, dùng viền `border-border`.

## Component (`components/ui`)

| Component | Biến thể / props chính | Ghi chú |
|---|---|---|
| `Button` | `variant`: `default` (gradient), `secondary`, `outline`, `ghost` (chữ), `destructive`, `link`; `size`: `xs sm default lg xl icon*`; `loading` | `loading` hiện spinner, khóa nút, đặt `aria-busy` |
| `Input` | `size="lg"` (kiểu đăng nhập), `startIcon`, `endAdornment` | nhận `aria-invalid` để hiện viền lỗi |
| `Checkbox` | — | chọn = gradient thương hiệu |
| `Label` | — | |
| `Card` | `CardHeader/Title/Description/Content/Footer/Action` | bề mặt phẳng cho trang trong |
| `GlassCard` | `variant`: `panel`/`pill`; `glass`: `always`/`sm` | chỉ đăng nhập; `sm` = trong suốt trên mobile |
| `Badge` | `status`: `dat`, `canh-bao`, `chua-dat`, `nhap`, `cho-duyet`, `da-duyet` | tự có icon + nhãn tiếng Anh mặc định; ứng dụng truyền `children` đã dịch (i18n) |
| `ProgressBar` | `value` (%), `label`, `showValue`, `size="sm"`, `animated` | ≥ 90 xanh, 60–89 vàng, < 60 đỏ (`KPI_THRESHOLDS`, `getKpiTone` — cấu hình trong `src/config/kpi.ts`); thanh vẽ tối đa 100% |
| `StatCard` | `label`, `value`, `unit`, `trend {value, inverse, caption, labels}`, `progress` | `inverse` cho chỉ số giảm là tốt |
| `FormAlert` | `tone`: `error`/`warning`/`success`/`info`; `title`, `icon` | có `title` → dạng khung đầy đủ; không → một dòng. `role=alert` cho lỗi/cảnh báo |
| `AppShell` | `sidebar`, `mobileSidebar`, `mobileSidebarOpen`, `header` | khung trang trong: sidebar + thanh trên chung nền `shell`, không đường kẻ; nội dung là tấm `panel` bo góc trên trái, chỉ tấm này cuộn. Dưới lg: menu trượt |
| `AppSidebar` / `SidebarNavGroup` / `SidebarNavItem` | `collapsed` (248 ↔ 72px), `toggle`, `onClose`; item: `icon`, `label`, `active`, `badge`, `render` (link router) | thu gọn → nhãn hiện bằng tooltip, nhóm thành đường kẻ |
| `SidebarToggle` | `collapsed`, `onToggle`, `labels`, `shortcut` | mờ khi chuột không ở trên sidebar; tooltip kèm phím tắt |
| `AccountMenu` / `Avatar` | `name`, `title`, `email`, `initials`, `items [{label, icon, shortcut, tone, separatorBefore, onSelect}]` | menu tài khoản duy nhất, ở avatar góc trên phải |
| `Tooltip` / `Kbd` | `content`, `shortcut`, `side`, `disabled` | Kbd = chip phím tắt |
| `Dialog` / `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description`; confirm: `onConfirm`, `tone`, `children`, `confirmDisabled` | ConfirmDialog = alert dialog (vd. thay đổi chưa lưu); `children` + `confirmDisabled` cho ô lý do bắt buộc |
| `DataGrid` | `columns` (`header`, `sub`, `note`, `width`, `pinned`, `tone`, `cell`, `footer`, `filter`), `groups` (`span`, `label`, `tone`, `marker`, `collapse` + `stub`, `subgroups`), `striped`, `wrapHeaders`, `rowAccent`, `footerLabel` | bảng rộng: nhóm cột + tiêu đề dính trên, cột `pinned` dính trái (bóng mờ khi cuộn), dòng tổng dính dưới; nhóm vắt qua mép cố định tự tách đôi; hàng nhóm 1 dòng 28px; `collapse` thu gọn nhóm thành cột 40px có nhãn dọc (`collapse.stub`); `subgroups` thêm tầng nhóm con 20px trên vài cột; `wrapHeaders` cho tiêu đề dài xuống dòng |
| `AbcChip` | `count`, `grade`, `tone` | chip bình bầu A-B-C, màu theo mức, không theo màu dòng |
| `MetricCard` / `Eyebrow` / `Pill` | `label`, `tag`, `value`, `unit`, `caption`, `footer` | thẻ số liệu trang Overview (`Card variant="raised"`) |
| `TrendChart` / `Sparkline` | `points`, `min`, `max`, `ticks`, `target`, `callout`, `labelEvery` | đường cong mượt có vùng gradient, tooltip từng điểm, đường vẽ dần (tắt khi giảm chuyển động) |
| `Toast` | `<Toaster />` đặt một lần ở `App`; `toast.success/error/warning(...)` | dùng cho kết quả thao tác tạm thời; lỗi cần ở lại trong form dùng `FormAlert` |

Ví dụ:

```tsx
<StatCard label={t("stats.completion")} value={formatNumber(92)} unit="%" trend={{ value: 18, caption: t("stats.vsLastQuarter") }} progress={92} />
<Badge status="cho-duyet">{t("status.cho-duyet")}</Badge>
<Button size="xl" loading={isSubmitting}>{t("submit")}</Button>
```

## Ngôn ngữ giao diện (i18n)
- Giao diện hiện **chỉ hiển thị tiếng Anh**, làm qua `react-i18next` để sau này thêm tiếng Việt, tiếng Trung. Mọi chữ hiển thị nằm trong `src/i18n/locales/en/*.json`; **không viết cứng chữ trong component**.
- Không viết nhãn song ngữ (không kèm chữ Hán/Việt bên cạnh chữ Anh). Dữ liệu từ hệ thống (tên bộ phận, họ tên) giữ nguyên như dữ liệu gốc; dòng tên tiếng Trung bị ẩn.
- Ngày và số định dạng qua `src/lib/format.ts` (`formatDate` → `15 Jan 2015`, `formatPercent` → `8.2%`), không tự ghép chuỗi.
- Component trong `components/ui/` không phụ thuộc i18n: chữ là prop, có mặc định tiếng Anh trung tính; trang truyền chuỗi đã dịch.
- Thêm ngôn ngữ: sao chép `locales/en` sang `locales/<mã>`, đăng ký trong `src/i18n/index.ts` và `lib/format.ts`.

## Quy ước khi thêm token / component
- Thêm giá trị sáng **và** tối trong `index.css`, rồi map vào `@theme inline` để có class Tailwind.
- Tên tuỳ biến mới trong `@theme` (cỡ chữ, bo góc, bóng) phải khai báo thêm trong `extendTailwindMerge` ở `src/lib/utils.ts`, nếu không `cn()` không gộp đúng class xung đột.
- Component mới export qua `src/design-system.ts`.
