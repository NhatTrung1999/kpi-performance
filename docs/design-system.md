# Design system — KPI Performance

Nguồn sự thật của token: `frontend/src/index.css` (Tailwind v4, khối `:root`, `.dark` và `@theme inline`).
Component dùng chung: `frontend/src/components/ui/`. Entry thư viện: `frontend/src/design-system.ts` (`npm run build:lib` → `frontend/dist-lib/`).

Dark mode: class `dark` trên `<html>` (xem `src/lib/theme.ts`). Mọi token bên dưới tự đổi giá trị, **không cần** viết `dark:` khi dùng token.

## Nguyên tắc

| | Trang đăng nhập | Trang bên trong |
|---|---|---|
| Mục đích | Tạo ấn tượng thương hiệu | Đọc số liệu nhanh, ít mỏi mắt |
| Hiệu ứng | Được dùng: nền mesh, khối sáng trôi, đường tăng trưởng, kính mờ (`GlassCard`), animation vào trang | **Tiết chế**: nền phẳng, `Card` thường, không blur, không gradient nền, không animation trang trí |
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
| `--brand` | `bg-brand`, `ring-brand` | `#6366F1` | `#818CF8` | focus ring, điểm nhấn |
| `--brand-from` → `--brand-to` | `bg-brand-gradient` | `#4F46E5` → `#2563EB` | giữ nguyên | nút chính, checkbox, logo |
| `--brand-text` | `text-brand-text` | `#4F46E5` | `#A5B4FC` | liên kết |
| `--info` | `text-info` | `#3B82F6` | `#60A5FA` | màu phụ (xanh dương) |
| `--primary` | `bg-primary` | `#4F46E5` | `#4F46E5` | token shadcn mặc định |

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
| `--page` / `--background` | `bg-page`, `bg-background` | `#F8FAFF` | `#0B0B0F` |
| `--card` | `bg-card` | `#FFFFFF` | `#15151C` |
| `--foreground` | `text-foreground` | `#111827` | `#F3F4F6` |
| `--text-secondary` | `text-text-secondary` | `#374151` | `#D1D5DB` |
| `--muted-foreground` | `text-muted-foreground` | `#6B7280` | `#9CA3AF` |
| `--placeholder` | `text-placeholder` | `#9CA3AF` | `#6B7280` |
| `--border` | `border-border` | `#E5E7EB` | `rgb(255 255 255 / .1)` |
| `--border-strong` | `border-border-strong` | `#D1D5DB` | `rgb(255 255 255 / .2)` |
| `--glass`, `--glass-border` | `bg-glass`, `border-glass-border` | `rgb(255 255 255 / .75)`, `/ .8` | `rgb(16 16 24 / .7)`, `rgb(255 255 255 / .1)` |

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
`shadow-glass`, `shadow-glass-sm` (kính mờ), `shadow-brand`, `shadow-brand-hover` (nút gradient), `shadow-field` (ô nhập), `shadow-toast`. Giá trị đổi theo sáng/tối trong `index.css`. Trang bên trong: ưu tiên không đổ bóng, dùng viền `border-border`.

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
| `ProgressBar` | `value` (%), `label`, `showValue` | ≥ 90 xanh, 60–89 vàng, < 60 đỏ (`KPI_THRESHOLDS`, `getKpiTone`); thanh vẽ tối đa 100% |
| `StatCard` | `label`, `value`, `unit`, `trend {value, inverse, caption, labels}`, `progress` | `inverse` cho chỉ số giảm là tốt |
| `FormAlert` | `tone`: `error`/`warning`/`success`/`info`; `title`, `icon` | có `title` → dạng khung đầy đủ; không → một dòng. `role=alert` cho lỗi/cảnh báo |
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
