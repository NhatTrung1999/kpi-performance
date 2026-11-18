# Design system — KPI Performance

Tài liệu này mô tả giao diện đang chạy trong `frontend/` (React 19 + TypeScript + Vite + Tailwind v4, Base UI, lucide-react).

| Nội dung | Nơi nằm |
|---|---|
| Token (màu, bóng, bo góc, cỡ chữ, hiệu ứng) | `frontend/src/index.css` — khối `:root`, `.dark`, `@theme inline`, `@theme` |
| Component dùng chung | `frontend/src/components/ui/` |
| Entry thư viện (cho `npm run build:lib` và `/design-sync`) | `frontend/src/design-system.ts` + `design-system.css` → `frontend/dist-lib/` |
| Sáng / tối | `frontend/src/lib/theme.ts`, `components/theme-toggle.tsx` |
| Ngôn ngữ | `frontend/src/i18n/`, `lib/language.ts`, `components/language-switch.tsx` |
| Định dạng ngày / số | `frontend/src/lib/format.ts` |
| Ngưỡng màu KPI | `frontend/src/config/kpi.ts` |

## 1. Phong cách

**Phẳng "soft blue"** — áp dụng cho cả trang trong lẫn trang đăng nhập:

- **Nền trang** xanh lam rất nhạt, có ba quầng sáng mềm (trắng ở góc trên trái, xanh trời ở góc trên phải và phía dưới): class `.flat-backdrop`.
- **Thẻ** trắng đặc, bo tròn lớn, viền gần như vô hình, **đổ bóng xanh mềm** (không bóng xám đen).
- **Điểm nhấn** là gradient xanh trời → xanh dương (`bg-brand-gradient`): nút chính, băng tiêu đề trang, thanh tiến độ, ô chọn.
- **Ô icon / chip** nền `accent` xanh nhạt, chữ/icon xanh dương.
- **Sidebar và thanh trên** nằm thẳng trên nền trang (không có cột trắng, không đường kẻ từ `lg`); mục đang chọn là thẻ trắng nổi.
- **Không dùng kính mờ** (blur, nền trong suốt) cho màn hình mới.

**Chế độ tối** cùng họ màu: nền navy `#0A1020`, thẻ navy `#111A2E`, viền xám xanh trong suốt, quầng sáng xanh mờ; gradient thương hiệu giữ nguyên.

### Nguyên tắc

1. **Số liệu là chính**: luôn `tabular-nums`, số lớn hơn nhãn, đơn vị nhỏ và nhạt (`text-muted-foreground`).
2. **Màu có nghĩa**: gradient thương hiệu chỉ cho hành động chính và băng tiêu đề; xanh lá / vàng / đỏ **chỉ** để chỉ trạng thái.
3. **Trạng thái không chỉ dựa vào màu**: luôn kèm icon hoặc chữ (`Badge` có icon + nhãn, `StatCard` có mũi tên + chữ ẩn cho trình đọc màn hình).
4. **Dùng token**, không viết hex hay `indigo-600` trong component. Ngoại lệ đang tồn tại: icon của toast (`components/ui/sonner.tsx` dùng `red/amber/indigo-*`), nền trang trí lễ của trang đăng nhập.
5. **Không viết `dark:`** khi đã dùng class token — token tự đổi giá trị theo class `dark` trên `<html>`.
6. **Khoảng cách theo bội số 4px**: `p-1`=4, `p-2`=8, `p-4`=16, `gap-6`=24.
7. **Hiệu ứng tiết chế** ở trang trong (chỉ băng tiêu đề và hiệu ứng xuất hiện); mọi hiệu ứng tắt khi người dùng bật "giảm chuyển động" (`prefers-reduced-motion`, khối cuối `index.css`).
8. **Chữ hiển thị đi qua i18n**; component trong `components/ui/` nhận chữ qua props.

## 2. Token

Mọi token khai báo giá trị sáng trong `:root`, giá trị tối trong `.dark`, rồi map sang class Tailwind trong `@theme inline`.

### 2.1 Màu thương hiệu

| Token | Class | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| `--brand` | `bg-brand`, `ring-brand`, `text-brand` | `#3B82F6` | `#60A5FA` | focus ring, ô tuần đã qua, điểm nhấn |
| `--brand-from` → `--brand-to` | `bg-brand-gradient` | `#38A3FF` → `#2B5CEB` | giữ nguyên | nút chính, `PageBanner`, checkbox, thanh tiến độ quý |
| `--brand-text` / `--brand-text-hover` | `text-brand-text`, `text-brand-text-hover` | `#2563EB` / `#1D4ED8` | `#7DB4FF` / `#A9CCFF` | liên kết, chữ nhấn |
| `--info` | `text-info`, `bg-info` | `#3B82F6` | `#60A5FA` | màu phụ xanh dương |
| `--primary` / `--primary-foreground` | `bg-primary`, `text-primary-foreground` | `#2F6BF2` / `#FFFFFF` | giữ nguyên | token shadcn mặc định |
| `--secondary` / `--secondary-foreground` | `bg-secondary`, `text-secondary-foreground` | `#EEF4FF` / `#1E3A8A` | `rgb(148 163 184 / .12)` / `#E2E8F0` | nút `secondary` |
| `--accent` / `--accent-foreground` | `bg-accent`, `text-accent-foreground` | `#E8F1FF` / `#1D4ED8` | `rgb(59 130 246 / .16)` / `#A9CCFF` | ô icon, chip `brand`, mục menu đang chọn, nút ngôn ngữ đang chọn |
| `--ring` | `ring-ring` | `var(--brand)` | `var(--brand)` | viền focus |

### 2.2 Trạng thái

| Ý nghĩa | Fill (`bg-*`) | Nền nhạt | Chữ (`text-*`) |
|---|---|---|---|
| Đạt | `success` `#10B981` | `success-soft` `#ECFDF5` / tối `rgb(16 185 129 / .1)` | `success-text` `#047857` / tối `#6EE7B7` |
| Cảnh báo | `warning` `#F59E0B` | `warning-soft` `#FFFBEB` / tối `rgb(251 191 36 / .12)` | `warning-text` `#B45309` / tối `#FCD34D` |
| Chưa đạt / Lỗi | `danger` `#EF4444` (biến `--destructive`) | `danger-soft` `#FEF2F2` / tối `rgb(248 113 113 / .07)` | `danger-text` `#DC2626` / tối `#F87171` |

Thêm: `danger-border` (`#FEE2E2` / tối `rgb(248 113 113 / .2)`) cho viền khung lỗi; `danger-strong` (`#B91C1C` / tối `#FCA5A5`) cho tiêu đề trong `FormAlert`.

Ngưỡng KPI (`config/kpi.ts`, `getKpiTone`): **≥ 90%** → `success`; **60–89%** → `warning`; **< 60%** → `danger`.

### 2.3 Nền, chữ, viền

| Token | Class | Sáng | Tối | Dùng cho |
|---|---|---|---|---|
| `--page` / `--background` | `bg-page`, `bg-background` | `#EDF2FD` | `#0A1020` | nền trang (thường dùng qua `.flat-backdrop`) |
| `--card` / `--popover` | `bg-card`, `bg-popover` | `#FFFFFF` | `#111A2E` | thẻ, ô nhập, menu, hộp thoại, toast |
| `--muted` | `bg-muted` | `#F1F5FC` | `rgb(148 163 184 / .1)` | nền chip trung tính, hover |
| `--foreground` | `text-foreground` | `#0F172A` | `#E8EEF9` | chữ chính |
| `--text-secondary` | `text-text-secondary` | `#334155` | `#C3CEE3` | chữ phụ, mục menu chưa chọn |
| `--muted-foreground` | `text-muted-foreground` | `#64748B` | `#8A9BBA` | chú thích, đơn vị |
| `--placeholder` | `text-placeholder` | `#94A3B8` | `#64748B` | chữ gợi ý trong ô nhập |
| `--border` | `border-border` | `#E2E9F6` | `rgb(148 163 184 / .16)` | viền thẻ, đường kẻ |
| `--input` | `border-input` | `#DCE5F5` | `rgb(148 163 184 / .2)` | viền ô nhập |
| `--border-strong` | `border-border-strong` | `#C9D6EE` | `rgb(148 163 184 / .3)` | viền khi hover |
| `--scrollbar-thumb` / `-hover` | (không có class) | `#C9D6EE` / `#64748B` | `rgb(148 163 184 / .3)` / `rgb(255 255 255 / .35)` | thanh cuộn |
| `--sidebar` | `bg-sidebar` | `#FFFFFF` | `#0E1628` | token shadcn; sidebar thật nằm trên `.flat-backdrop` |
| `--chart-1…5` | `text-chart-1`… | `#3B82F6`, `#38BDF8`, `#10B981`, `#F59E0B`, `#EF4444` | `#60A5FA`, `#38BDF8`, `#34D399`, `#FBBF24`, `#F87171` | màu chuỗi biểu đồ |

**Token di sản của giao diện kính (không dùng cho màn hình mới):** `--shell` (`#070B14`), `--panel`, `--tab-foreground`, `--glass-rim`, `--glass`, `--glass-border`, `--surface-dark`, `shadow-glass(-sm)`, cùng các class `.shell-*`, `.liquid-panel/-tab/-rim/-popup/-drawer`, `.login-backdrop`, `.login-glass`, `.login-form-glass`. Chúng còn trong `index.css` vì các nhánh `glass` trong component chưa dọn (`useGlassUi()` luôn trả `false`).

### 2.4 Bảng dữ liệu (`DataGrid`)

Mọi token dưới đây là màu **đục** (hex đã pha sẵn trên `card`) vì nằm trên ô dính (sticky): nội dung cuộn qua không được lộ ra.

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
| `--grid-row-muted` | `bg-grid-row-muted` | `var(--muted)` | `#1A2338` | dòng làm mờ (tạm hoãn, sắp thôi việc) |
| `--grid-row-danger` | `bg-grid-row-danger` | `#FEF4F4` | `#2C1E24` | dòng bị từ chối |

### 2.5 Font và cỡ chữ

Font: **Be Vietnam Pro** (400/500/600/700/800; subset vietnamese, latin-ext, latin; tự host qua `@fontsource`, khai báo trong `src/fonts.css`). Chữ Hán rơi về font CJK có sẵn trên máy (`Noto Sans TC`, `Microsoft JhengHei`, `PingFang TC`). `font-sans`, `font-heading` và `font-login` là cùng một font.

| Class | Cỡ | Dùng cho |
|---|---|---|
| `text-[11px]` | 11px | `Eyebrow`, `Pill`, `Kbd`, `AbcChip`, nhãn nhóm sidebar |
| `text-xs` | 12px | badge, chú thích, huy hiệu banner |
| `text-label` | 13px | thông báo lỗi, mô tả phụ, bảng `comfortable` |
| `text-sm` | 14px | nhãn, nội dung thường, mục menu |
| `text-body` | 15px | ô nhập lớn, nút lớn, tiêu đề thông báo |
| `text-base` | 16px | tiêu đề thẻ, tiêu đề hộp thoại |
| `text-lg` | 18px | tiêu đề `PageBanner` |
| `text-title` / `text-3xl` | 30px | tiêu đề form đăng nhập / số lớn `StatCard` |
| `text-4xl` | 36px | số chính của `MetricCard` |
| `text-5xl`–`text-6xl` | 48–60px | giờ và số ngày ở trang đăng nhập |

Số liệu luôn thêm `tabular-nums`; số lớn dùng `tracking-[-0.03em]` đến `[-0.05em]`.

### 2.6 Bo góc

| Class / giá trị | px | Dùng cho |
|---|---|---|
| `rounded-sm` | 4 | checkbox, ô tuần |
| `rounded-md` | 8 | nút `xs`/`sm` |
| `rounded-lg` | 12 | nút, ô nhập mặc định, mục menu |
| `rounded-[10px]` | 10 | mục sidebar, ô icon nhỏ, logo |
| `rounded-control` | 14 | ô nhập lớn, nút `xl`, `FormAlert`, toast, menu tài khoản |
| `rounded-xl` | 16 | `Card`, ô icon lớn |
| `rounded-2xl` | 20 | `PageBanner`, hộp thoại |
| 18 (CSS) | 18 | dải hướng dẫn (`data-slot="guide-strip"`) |
| 22 (CSS) | 22 | khung bảng (`TableCard`), thẻ thông tin (`InfoCard` và các thẻ dựng trên nó) |
| `rounded-hero` / `rounded-3xl` | 28 | thẻ form đăng nhập |
| `rounded-full` | — | chip, pill, nút tròn thanh trên, avatar |

Bo 22px và 18px đặt bằng CSS theo `data-slot` ở cuối `index.css` (mục "Giao diện phẳng"), không phải class trên component.

### 2.7 Đổ bóng

| Class | Dùng cho | Sáng | Tối |
|---|---|---|---|
| `shadow-brand` / `shadow-brand-hover` | nút gradient, `PageBanner` | bóng xanh dương `rgb(37 99 235 / .6)` | xanh dương đậm + đen |
| `shadow-panel` | khung bảng, thẻ thông tin, thẻ form đăng nhập | `0 22px 48px -24px rgb(37 99 235 / .3)` | viền mảnh + bóng đen |
| `shadow-card` | `Card variant="raised"` | `0 16px 36px -20px rgb(37 99 235 / .28)` | bóng đen |
| `shadow-nav` | mục sidebar đang chọn, nút tròn thanh trên | `0 8px 20px -10px rgb(37 99 235 / .3)` | viền mảnh + bóng đen |
| `shadow-toast` | toast, menu, popover, hộp thoại, menu trượt mobile | `0 22px 48px -18px rgb(30 64 175 / .3)` | bóng đen |
| `shadow-field` | ô nhập lớn | `0 1px 2px rgb(30 58 138 / .04)` | không |
| `shadow-grid-footer` | phía trên dòng tổng `DataGrid` khi còn dòng bị che | bóng xám | bóng đen |
| `shadow-grid-pin` | mép phải các cột cố định của `DataGrid` khi đã cuộn ngang | bóng xanh nhạt | bóng đen |

### 2.8 Hiệu ứng

| Class | Mô tả | Dùng ở |
|---|---|---|
| `animate-card-in` / `animate-form-in` | mờ dần + nhích lên (360 / 400ms) | thẻ thông tin, thẻ form đăng nhập |
| `animate-rise-in` | như `card-in`, đường cong mạnh hơn | thẻ trang Overview |
| `animate-banner-enter` / `-shine` / `-wave` | băng trượt lên, vệt sáng lướt một lần, sóng trôi | `PageBanner` |
| `animate-digit-in`, `animate-colon` | chữ số trượt lên, dấu `:` nhấp nháy | `ClockCard` |
| `animate-fill-in` / `animate-tick-in` / `animate-bar-in` | thanh lấp từ trái sang | thanh tiến độ, ô tuần |
| `animate-line-in` | đường biểu đồ vẽ dần | `TrendChart`, `Sparkline` |
| `animate-sweep` | vệt sáng quét định kỳ | `CountdownCard` |
| `animate-pulse-soft`, `animate-blur-in`, `animate-slide-down`, `animate-fade-up` | chấm trạng thái, hiện mờ dần, trượt xuống | trang đăng nhập, thông báo |

Chuyển tiếp thông thường: 150–200ms `ease-out`. Thẻ nổi (`raised`, `InfoCard`) nhích lên 2px khi hover.

### 2.9 Class tiện ích riêng

| Class | Tác dụng |
|---|---|
| `.flat-backdrop` | nền trang xanh nhạt + quầng sáng (sáng và tối); gắn ở gốc `AppShell`, trang đăng nhập, menu trượt mobile |
| `.liquid-glass` | nút tròn nền thẻ + viền + `shadow-nav` (nút sáng/tối, nút ngôn ngữ, nút thu sidebar). Tên cũ từ giao diện kính, giờ là kiểu phẳng |
| `.app-logo`, `.app-avatar` | ô logo / avatar nền `accent`, chữ `brand-text` |

Thanh cuộn: toàn hệ thống dùng thanh mảnh 8px, con trượt bo tròn (khai báo một lần trong `index.css`); không tự đặt kiểu thanh cuộn trong component.

## 3. Bố cục

- **Breakpoint chính là `lg` (1024px).** Từ `lg`: khung cao đúng màn hình, sidebar bên trái, chỉ vùng nội dung cuộn. Dưới `lg`: cuộn cả trang, sidebar thành menu trượt từ trái (lớp phủ, `Esc` để đóng), thanh trên dính đầu trang với nền `bg-page/80` mờ.
- **Thanh trên** cao 56px: (nút mở menu trên mobile) tiêu đề trang → `Pill tone="brand"` ghi kỳ hiện tại → khoảng trống → `ThemeToggle` → `LanguageSwitch` → `AccountMenu`. Vai trò không có sidebar thì bên trái là logo + tên ứng dụng.
- **Sidebar** rộng 248px, thu gọn còn 72px (`Ctrl/⌘ + B`). Mục cao 40px, bo 10px; mục đang chọn nền `card`, chữ `accent-foreground`, `shadow-nav`. Thu gọn: nhãn hiện bằng tooltip, nhãn nhóm thành đường kẻ ngắn.
- **Trang dạng bảng**: `PageShell` (padding 16px mobile / 32px desktop, khoảng cách khối 16px) → `PageBanner` → hàng bộ lọc → `TableCard` → `TableCardBody` → `DataGrid`.
- **Trang bảng vừa khít màn hình** (Đề xuất KPI, Thăng chức & lương): `PageBanner compact` + `TableCard fit` — không cuộn ngoài, bảng cao vừa đủ số dòng, tối thiểu 5 dòng, thanh cuộn ngang nằm sát dưới dòng cuối.
- **Trang đăng nhập**: hai cột từ `lg` — bên trái là các thẻ thông tin công khai (đồng hồ, đếm ngược quý, thông báo, tiến độ quý, có gì mới), bên phải là thẻ form trắng bo 28px; góc trên có nút sáng/tối và nút ngôn ngữ. Mobile xếp một cột.
- **Phím tắt**: `Ctrl/⌘ + B` thu/mở sidebar, `?` mở bảng phím tắt.

## 4. Component (`components/ui`)

Chữ hiển thị đều là props (mặc định tiếng Anh trung tính); trang truyền chuỗi đã dịch. Mỗi component gắn `data-slot="<tên>"` để CSS và kiểm thử bám vào.

### 4.1 Hành động và nhập liệu

| Component | Props chính | Ghi chú |
|---|---|---|
| `Button` | `variant`: `default` (gradient + `shadow-brand`, nhích lên khi hover), `outline`, `secondary`, `ghost`, `destructive` (nền đỏ nhạt), `link`. `size`: `xs` 24, `sm` 28, `default` 32, `lg` 36, `xl` 48 (bo 14, chữ 15 đậm), `icon`, `icon-xs`, `icon-sm`, `icon-lg`. `loading` | `loading` hiện spinner, khóa nút, đặt `aria-busy`. Mỗi màn hình chỉ một nút `default` |
| `Input` | `size`: `default` (cao 32) / `lg` (cao 48, bo 14); `startIcon`, `endAdornment` | `aria-invalid` hiện viền + vòng đỏ. Focus: viền `brand` + vòng `brand/15`. Nền luôn là `card` |
| `Checkbox` | props của Base UI (`checked`, `indeterminate`, `onCheckedChange`) | 16px; chọn = gradient thương hiệu; chọn một phần = gạch ngang |
| `Label` | props của `<label>` | chữ 14 đậm vừa; đi cùng `Input` |
| `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverClose` | content: `side`, `align`, `sideOffset` | menu chọn (bộ lọc, chọn đơn vị): render qua portal, rộng bằng nút neo, tự lật khi hết chỗ, cao tối đa 360px. `onListKeyDown` cho điều hướng ↑/↓/Home/End trong danh sách `role="option"` |

### 4.2 Hiển thị trạng thái

| Component | Props chính | Ghi chú |
|---|---|---|
| `Badge` | `status`: `dat` (On track), `canh-bao` (At risk), `chua-dat` (Behind), `nhap` (Draft), `cho-duyet` (Pending review), `da-duyet` (Approved) | cao 24, luôn có icon + chữ; truyền `children` đã dịch để thay nhãn mặc định |
| `Pill` | `tone`: `neutral`, `brand`, `success`, `warning`, `danger` | chip tròn cao 22, chữ 11 đậm — nhãn kỳ, số đếm, trạng thái ngắn |
| `AbcChip` | `count`, `grade`, `tone?` | chip bình bầu A-B-C ("2C"). Mặc định: C ≥ 3 lần → đỏ, C = 2 → vàng, còn lại trung tính; màu theo mức, không theo màu dòng |
| `Kbd` | — | chip phím tắt cao 18 |
| `Eyebrow` | — | nhãn chữ hoa 11px giãn chữ, tiêu đề phụ của thẻ |
| `ProgressBar` | `value` (%), `label`, `showValue`, `size="sm"`, `animated` | màu theo ngưỡng KPI; thanh vẽ tối đa 100% nhưng số vẫn hiện giá trị thật |
| `FormAlert` | `tone`: `error`, `warning`, `success`, `info`; `title`, `icon` | có `title` → khung đầy đủ (ô icon + tiêu đề + mô tả); không → một dòng. `role="alert"` cho lỗi/cảnh báo. Dùng cho thông báo phải ở lại trong form |
| `Toaster` + `toast` | `<Toaster label closeLabel />` đặt một lần ở `App`; `toast.success/error/warning/info(...)` | góc trên phải, tối đa 3 cái, thẻ `card` bo 14 + `shadow-toast`, đổi theo sáng/tối. Dùng cho kết quả thao tác tạm thời |

### 4.3 Thẻ

| Component | Props chính | Ghi chú |
|---|---|---|
| `Card` + `CardHeader/Title/Description/Action/Content/Footer` | `size`: `default`/`sm`; `variant`: `default` (viền mảnh) / `raised` (viền + `shadow-card`, nhích lên khi hover) | bề mặt cơ bản, bo 16 |
| `StatCard` | `label`, `value`, `unit`, `trend {value, inverse, caption, labels}`, `progress` | `trend.inverse` cho chỉ số giảm là tốt; `progress` hiện `ProgressBar` |
| `MetricCard` | `label`, `tag` (thường là `Pill`), `value` (36px), `unit`, `caption`, `footer` | thẻ số liệu tổng quan, dựng trên `Card variant="raised"`; `footer` cao 32px cho thanh tiến độ hoặc `Sparkline` |
| `InfoCard` | `delay`, `tone`: `default` / `brand` | khung thẻ thông tin trang công khai: bo 22, hiện lần lượt theo `delay`, nhích lên khi hover; `brand` = nền gradient xanh nhạt |
| `ClockCard` | `label`, `hours`, `minutes`, `period`, `date` | nhận giờ đã định dạng (`formatClockParts`), không tự lấy giờ |
| `CountdownCard` | `label`, `days`, `daysLabel`, `weeks` (13), `filledWeeks`, `compact`, `trailing` | số đếm tăng từ 0, ô tuần lấp dần; `compact` = một dòng cho mobile |
| `QuarterProgress` | `title`, `caption`, `progress` (0–100), `marks` | thanh tiến độ quý + các mốc tháng |
| `AnnouncementCard` | `icon`, `badge`, `title`, `description`, `aside` | thông báo (vd. từ phòng Nhân sự); ô icon vàng nhạt |
| `UpdatesList` | `title`, `action {label, href}`, `items [{id, icon, tone, tag, title, detail, date, href}]` | danh sách "Có gì mới"; `tone`: `warning`, `brand`, `info`, `success` |
| `GlassCard` | `variant`: `panel`/`pill`; `glass`: `always`/`sm` | **di sản** của giao diện kính, còn export nhưng không dùng cho màn hình mới |

Các thẻ trang công khai (`InfoCard`, `ClockCard`, `CountdownCard`, `QuarterProgress`, `AnnouncementCard`, `UpdatesList`) chỉ hiển thị thông tin công khai — không có họ tên hay số liệu KPI nội bộ.

### 4.4 Khung trang

| Component | Props chính | Ghi chú |
|---|---|---|
| `AppShell` | `sidebar`, `mobileSidebar`, `mobileSidebarOpen`, `onMobileSidebarClose`, `header`, `children` | gốc là `.flat-backdrop`; vùng nội dung là phần duy nhất cuộn từ `lg` |
| `AppSidebar` | `collapsed`, `logo`, `name`, `toggle`, `onClose`, `closeLabel`, `navLabel` | 248 ↔ 72px; `onClose` hiện nút X (menu trượt mobile) |
| `SidebarNavGroup` | `label`, `collapsed` | nhãn chữ hoa; thu gọn thành đường kẻ |
| `SidebarNavItem` | `icon`, `label`, `active`, `collapsed`, `badge`, `render` (link router), `onClick` | `badge`: chip số khi mở rộng, chấm đỏ khi thu gọn |
| `SidebarToggle` | `collapsed`, `onToggle`, `labels {collapse, expand}`, `shortcut` | nút tròn 36px; tooltip kèm phím tắt |
| `AccountMenu` / `Avatar` | `name`, `initials`, `title`, `email`, `items [{key, label, icon, shortcut, tone, separatorBefore, onSelect}]`, `triggerLabel`, `avatarSize` | menu tài khoản duy nhất ở avatar góc trên phải; `tone: "danger"` cho Đăng xuất. `Avatar size`: `sm` 32, `md` 36, `lg` 40 |
| `PageShell` | props của `<main>` | khung nội dung trang dạng bảng |
| `PageBanner` | `icon`, `title`, `subtitle`, `badges [{label, value, loading, onClick, active, dot, title}]`, `loadingLabel`, `compact` | băng gradient bo 20 + `shadow-brand`, có sóng trôi và vệt sáng. Huy hiệu có `onClick` thành nút lọc; `active` = nền trắng đặc; `dot` = chấm cảnh báo |
| `TableCard` | `fit`, `minRows` (5) | khung bảng bo 22 + `shadow-panel`; không `fit` thì giãn hết chiều cao còn lại (tối thiểu 320px) |
| `TableCardBar` | — | hàng cố định trong khung (tiêu đề, thanh công cụ) |
| `TableCardBody` | — | vùng cuộn duy nhất của trang từ `lg`; thêm `className="flex flex-col"` khi chứa `DataGrid` |

Ngoài thư viện (dùng trong app, không export): `AppLogo` (`components/ui/app-logo.tsx`), `ThemeToggle`, `LanguageSwitch`, `Header`, `Sidebar` (`components/common/`).

### 4.5 Lớp nổi

| Component | Props chính | Ghi chú |
|---|---|---|
| `Tooltip` | `content`, `shortcut`, `side` (mặc định `right`), `sideOffset`, `disabled`, `delay` (300ms) | bọc đúng một phần tử kích hoạt |
| `Dialog` | `open`, `onOpenChange`, `title`, `description`, `closeLabel`, `children` | hộp thoại thông tin 400px bo 20, có nút X, đóng bằng `Esc` / bấm ra ngoài |
| `ConfirmDialog` | `open`, `onOpenChange`, `title`, `description`, `confirmLabel`, `cancelLabel`, `onConfirm`, `tone`: `default`/`danger`, `children`, `confirmDisabled` | hộp xác nhận chặn; tiêu điểm mặc định ở nút Hủy. `children` + `confirmDisabled` cho ô lý do bắt buộc |

Mọi lớp nổi render qua portal vào `<body>`, `z-50`, nền `popover`, viền `border`, `shadow-toast`. Lớp phủ nền `bg-black/45`.

### 4.6 Bảng dữ liệu — `DataGrid`

Bảng dạng CSS grid cho bảng rộng nhiều cột. Phải là con **trực tiếp** của khung cuộn (`TableCardBody className="flex flex-col"`).

**Props của bảng**

| Prop | Ý nghĩa |
|---|---|
| `columns`, `rows`, `rowKey` | dữ liệu |
| `groups` | hàng nhóm cột phía trên tiêu đề; tổng `span` phải bằng số cột |
| `density` | `compact` (mặc định, bảng rộng) / `comfortable` (tiêu đề 48px, dòng 56px, chữ 13px, padding ngang 16px — bảng ít cột lấp đủ chiều ngang) |
| `striped` | sọc xen kẽ (`bg-grid-row-alt`) thay cho đường kẻ |
| `hoverRows` | tô cả dòng khi rê chuột (`bg-grid-row-hover`) |
| `wrapHeaders` | tiêu đề dài xuống dòng thay vì cắt "…" |
| `centerHeaders`, `centerCells` | căn giữa tiêu đề / nội dung ô |
| `rowClassName`, `rowAccent` | nền riêng cho dòng (phải đục) / vạch màu 3px ở mép trái dòng |
| `empty`, `fillEmpty` | nội dung khi không có dòng / ô trống giãn hết khung và căn giữa |
| `footerLabel` | nhãn dòng tổng (dính đáy, phủ các cột cố định); không truyền = không có dòng tổng |
| `aria-label` | nhãn bảng cho trình đọc màn hình |

**Cột** (`DataGridColumn`): `key`, `header`, `sub` (dòng phụ, vd. nhãn tiếng Trung), `note` (ghi chú nghiêng, chỉ khi `wrapHeaders`), `tooltip`, `width` (số px hoặc track CSS như `minmax(180px,1fr)`), `align` (`start`/`end`), `pinned` (dính trái — chỉ các cột đầu liên tiếp, `width` phải là số), `tone`, `divider`, `cell(row, index)`, `field` (ô chứa ô nhập), `cellClassName`, `footer`, `filter {label, active, onClick}`.

**Nhóm** (`DataGridGroup`): `key`, `span`, `label`, `tooltip`, `tone`, `marker` (`brand`, `muted`, `warning`, `info`, `success`), `divider`, `collapse {collapsed, onToggle, label, stub}`, `hidden {label, stub}`, `subgroups [{key, label, from, span}]`.

**Tông** (`DataGridTone`): `read`, `input`, `locked`, `plain`, `warn`, `info`, `salary`, `success` — ứng với các token `grid-*` ở mục 2.4.

**Hành vi**

- Hàng nhóm cột (28px, một dòng) và hàng tiêu đề dính trên; dòng tổng dính dưới trong cùng vùng cuộn nên luôn thẳng cột.
- Cột `pinned` dính trái; đã cuộn ngang thì mép phải phần cố định có `shadow-grid-pin`. Nhóm vắt qua mép cố định tự tách đôi.
- `collapse` thu nhóm thành cột hẹp 40px có nhãn dọc `stub` (nút −/+ ở góc phải nhóm).
- `hidden` (nhóm bị ẩn theo quyền, `span: 0`): cột hẹp 40px có icon khóa và nhãn dọc, không mở được.
- `subgroups` thêm tầng nhóm con 20px chỉ trên các cột của nhóm con; tiêu đề cột khác cao hết hai hàng.
- Nút lọc trên tiêu đề chỉ hiện khi rê chuột / focus, hoặc luôn hiện khi cột đang lọc.

### 4.7 Biểu đồ

| Component | Props chính | Ghi chú |
|---|---|---|
| `TrendChart` | `points [{label, value, tooltip}]`, `min` (40), `max` (100), `ticks [{value, label}]`, `target`, `callout {title, value, caption}`, `labelEvery`, `ariaLabel` | đường cong mượt + vùng gradient thương hiệu, lưới ngang, đường mục tiêu nét đứt, điểm cuối có vòng sáng và ô chú thích; rê chuột hiện tooltip từng điểm |
| `Sparkline` | `values`, `tone` | đường xu hướng nhỏ cho đáy `MetricCard` |

### 4.8 Ví dụ

```tsx
// Trang bảng vừa khít màn hình
<PageShell>
  <PageBanner compact icon={<FileText />} title={t("title")} subtitle={period}
    badges={[{ label: t("open"), value: deadline, dot: true }, { label: t("filled"), value: "0/10" }]} />
  <TableCard fit>
    <TableCardBody className="flex flex-col">
      <DataGrid aria-label={t("title")} columns={columns} rows={rows} rowKey={(r) => r.id}
        striped wrapHeaders footerLabel={t("total")} />
    </TableCardBody>
  </TableCard>
</PageShell>

// Thẻ số liệu
<MetricCard label={t("completion")} tag={<Pill tone="brand">Q4</Pill>} value={formatNumber(78)} unit="%"
  footer={<ProgressBar value={78} size="sm" animated />} />
<Badge status="cho-duyet">{t("status.cho-duyet")}</Badge>
<Button size="xl" loading={isSubmitting}>{t("submit")}</Button>
```

## 5. Sáng / tối

- Class `dark` trên `<html>` là nguồn sự thật duy nhất (`lib/theme.ts`): `useTheme()` trả `{ theme, setTheme, toggle }`.
- Lựa chọn lưu ở localStorage `kpi-theme`; chưa chọn thì theo cài đặt của hệ điều hành.
- `index.html` có đoạn script chạy trước khi tải app để đặt class ngay — không chớp trắng khi tải lại.
- Nút `ThemeToggle` (mặt trăng / mặt trời) nằm cạnh nút ngôn ngữ ở thanh trên và trang đăng nhập.
- Toast đổi theo cùng nguồn này.
- `<html data-ui="flat">` được gắn lúc khởi động (`lib/ui-theme.ts`) — chỉ còn là dấu hiệu, CSS không phụ thuộc vào nó.

Khóa localStorage khác: `kpi-language` (ngôn ngữ), `kpi-perf` (chế độ nhẹ cho máy yếu), `kpi-season-off` (tắt trang trí lễ).

## 6. Ngôn ngữ giao diện (i18n)

- Ba ngôn ngữ, theo thứ tự trên nút: **Tiếng Việt (`vi`, mặc định)**, **Tiếng Trung phồn thể (`zh`)**, **Tiếng Anh (`en`)**. Tiếng Anh là dự phòng khi thiếu key và là nguồn kiểu cho key.
- Mọi chữ hiển thị nằm trong `src/i18n/locales/<mã>/*.json` (namespace `common`, `nav`, `auth`, `errors`, `roles`, `proposal`, `promotion`). **Không viết cứng chữ trong component.** Thêm key mới phải thêm đủ cả ba ngôn ngữ — thiếu `vi` hoặc `zh` thì build báo lỗi.
- Nút `LanguageSwitch` (VI / 中文 / EN) trên thanh trên và trang đăng nhập; lựa chọn lưu ở `kpi-language`.
- Chú thích tiếng Trung song song chỉ có ở nơi thiết kế nghiệp vụ quy định: dòng phụ (`sub`) của tiêu đề cột bảng Đề xuất KPI và Thăng chức & lương, các chú thích của trang Phân quyền. Nơi khác không ghép hai ngôn ngữ.
- Dữ liệu từ hệ thống (tên bộ phận, họ tên) giữ nguyên như dữ liệu gốc.
- Component trong `components/ui/` không phụ thuộc i18n: chữ là props, có mặc định tiếng Anh trung tính.

### Định dạng ngày và số (`lib/format.ts`)

Không tự ghép chuỗi ngày/số. Ngày lưu dạng ISO `YYYY-MM-DD`.

| Hàm | Kết quả | Ghi chú |
|---|---|---|
| `formatDate` | `15 Jan 2015` | theo ngôn ngữ đang dùng |
| `formatSlashDate` | `2017/06/02` | quy ước bảng nghiệp vụ, không đổi theo ngôn ngữ |
| `formatIsoDate` | `2015-01-15` | |
| `formatMoney` / `formatAccounting` | `3,000,000`; âm → `(500,000)` | quy ước kế toán, không đổi theo ngôn ngữ; số âm tô `text-danger-text` |
| `formatNumber`, `formatPercent` | `8.2%` | theo ngôn ngữ |
| `formatMonthRange` | `07–09/2026` | kỳ theo tháng |
| `formatPeriodShort` / `formatPeriodLabel` | `2026.10 ~ 12` / `2026 07-09` | nhãn kỳ |
| `formatSlashMonth`, `formatMonthYear`, `formatMonthShort` | `10/2026`, `Oct 2026`, `Oct` | |
| `formatClockParts`, `formatLongDate`, `formatTime`, `formatWeekdayShort` | giờ / ngày theo múi giờ | trang đăng nhập |

## 7. Trợ năng

- Mọi nút chỉ có icon phải có `aria-label` (và thường kèm `Tooltip`).
- Focus bàn phím luôn thấy được: vòng `ring-ring/50` dày 3px (hoặc `ring-brand/15` dày 4px ở ô nhập lớn).
- Thanh tiến độ có `role="progressbar"` và `aria-valuenow`; biểu đồ có `role="img"` + `ariaLabel`.
- Số đếm chạy và đồng hồ có bản `sr-only` ghi giá trị thật.
- Hộp xác nhận đặt tiêu điểm ở nút Hủy; menu trượt mobile đóng bằng `Esc`.
- Bật "giảm chuyển động": mọi hiệu ứng và chuyển tiếp tắt.

## 8. Quy ước khi thêm token / component

- Thêm giá trị sáng **và** tối vào đúng khối `:root` và `.dark` đang có trong `index.css`, rồi map vào `@theme inline` để có class Tailwind.
- **Chỉ được có một khối `:root` và một khối `.dark` ở cấp ngoài cùng.** Thêm khối thứ hai thì `npm run build:lib` báo lỗi (bước tách token cho `/design-sync`).
- Không dùng `color-mix()` trong giá trị token ở `:root` / `.dark` (Lightning CSS sinh thêm khối `:root` dự phòng) — ghi hex đã pha sẵn như các token `--grid-*`.
- Ô dính (sticky) của bảng cần nền đục: `bg-card` hoặc `bg-grid-*`.
- Tên tuỳ biến mới trong `@theme` (cỡ chữ, bo góc, bóng) phải khai báo thêm trong `extendTailwindMerge` ở `src/lib/utils.ts`, nếu không `cn()` không gộp đúng class xung đột. Hiện danh sách `shadow` ở đó chưa có `card`, `panel`, `nav`, `grid-pin`.
- Class token và utility mới muốn dùng được trong Claude Design phải thêm vào danh sách `@source inline(...)` của `src/design-system.css`.
- Component mới: đặt trong `components/ui/`, gắn `data-slot`, nhận chữ qua props, export qua `src/design-system.ts`.
