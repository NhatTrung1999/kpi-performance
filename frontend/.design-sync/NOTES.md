# design-sync notes — KPI Performance

- Shape: `package` (no Storybook). Entry `dist-lib/design-system.js` (from `src/design-system.ts`, built by `npm run build:lib`); global `window.KpiDS`; pkg name `frontend` (previews import from `'frontend'`).
- `dist-lib/` had no `.d.ts`, so `build:lib` now also runs `scripts/build-lib-types.mjs` (tsc via `tsconfig.lib.json` -> `dist-lib/types/`, rewriting the `@/` alias to relative paths). `package.json` `types` points at `dist-lib/types/design-system.d.ts`. Always rebuild with `npm run build:lib` before the converter.
- Tailwind v4 only emits classes found in source, so `src/design-system.css` lists `@source inline(...)` for tokens AND layout utilities (spacing, grid-cols, flex, sizes...). Any utility class named in `conventions.md` must be in that list, otherwise designs render it unstyled. Verify with grep against `ds-bundle/_ds_bundle.css`.
- Fonts (Be Vietnam Pro) are inlined as base64 `@font-face` in the CSS — no `fonts/` dir, no `[FONT_MISSING]`.
- `componentSrcMap` nulls out `CardHeader/Title/Description/Action/Content/Footer` (documented under `Card`; still exported on `window.KpiDS`).
- `guidelinesGlob: ["../docs/*.md"]` pulls `docs/design-system.md` into `guidelines/`.
- Icons: `lucide-react` is not in the bundle (not exported by the DS). Previews use inline SVG when they need an icon.
- Overrides: Toaster `cardMode: single` (viewport 420x260; toasts are portaled), Card/StatCard/FormAlert/GlassCard/Input/ProgressBar `cardMode: column`.
- Toaster previews fire `toast.*` in an effect with `duration: Infinity`.

- `vite.lib.config.ts` externalizes `use-sync-external-store` (pulled in by Base UI Popover). Bundled inline, Rolldown emits a CJS `require("react")` that throws "Dynamic require" in every preview; external lets the converter bundle it through its React shim. If every preview goes `root empty` after a dep change, grep `dist-lib/design-system.js` for `("react")`.
- Popover: `componentSrcMap` nulls PopoverTrigger/Content/Close (documented under `Popover`); Popover is `cardMode: single`, primaryStory ChonDonVi (portaled, so GRID_OVERFLOW otherwise).
- Remote project also holds `templates/` and `screenshots/` (not from this sync, outside the plan) - never delete them.

## Known render warns
- `[RENDER_THIN]` Toaster: rendered height 0 because the toast is portaled/fixed; screenshot shows the toasts correctly — benign.

## Yêu cầu bắt buộc cho token khi đồng bộ (2 quy tắc — áp dụng cho mọi lần sync)
Claude Design đã nhiều lần báo cảnh báo token. Nguyên nhân gốc: khi không có `tokens/`, bước sync quét toàn bộ `_ds_bundle.css` và ghi cả biến `--tw-*` của utility vào danh sách token. Cơ chế hiện tại:
- `vite.lib.config.ts` (plugin `designSyncTokens`, chỉ chạy cho build:lib) tách các khối token sang **`dist-lib/tokens/tokens.css`**: câu lệnh `@layer properties, theme, base, components, utilities;` (giữ nguyên thứ tự layer), `:root,:host` của `@layer properties` (`--shimmer-angle`) và của `@layer theme`, rồi `:root` và `.dark` (ngoài layer). Các khối này không nén, mỗi khai báo một dòng. `dist-lib/design-system.css` không còn khối token nào. Build báo lỗi nếu cấu trúc CSS của Tailwind thay đổi khiến không tách được.
- `.design-sync/config.json`: `"tokensPkg": ".."` (thư mục `frontend`, tính từ `--node-modules ./node_modules`) + `"tokensGlob": "dist-lib/tokens/*.css"`. Converter copy file đó vào `ds-bundle/tokens/`; `styles.css` `@import` `tokens/tokens.css` trước `_ds_bundle.css`; danh sách token trong README chỉ lấy từ `tokens/`. **Không bỏ hai key này** — thiếu chúng, bước sync quay lại quét `_ds_bundle.css`.

**Quy tắc 1 — chỉ đăng ký token trong `:root` / `.dark`** (gồm cả `:root,:host` của Tailwind theme). Không quét, không gắn `@kind`, không đăng ký bất kỳ biến `--tw-*` nào, cũng như mọi biến khai báo dưới selector của utility class (`:where(.space-y-*>…)`, `.translate-x-1`, …) hay trong `@property`. Không chuyển `--tw-*` vào `:root`. Các biến đó ở nguyên trong `_ds_bundle.css`.

**Quy tắc 2 — token hiệu ứng/easing là `@kind other`**, chú thích cùng dòng với khai báo: `--ease-out`, `--animate-*`, `--shimmer-angle`, `--default-transition-*`, `--blur-*`, `--perspective-*`, `--aspect-*`… (`kindOf` trong `vite.lib.config.ts`; thêm prefix mới vào regex đầu tiên của hàm khi có loại token hiệu ứng mới). Các token khác: `color`/`font`/`radius`/`shadow`/`spacing` theo tên, hoặc theo giá trị màu / `var()` trỏ tới token đã biết.

Kiểm tra nhanh sau `npm run build:lib`:
- `grep -c '@kind' dist-lib/design-system.css` ra 0
- `grep -c -- '--tw-' dist-lib/tokens/tokens.css` ra 0
- `grep -E -- '^\s*--(ease|animate|shimmer|default-transition|blur)' dist-lib/tokens/tokens.css | grep -vc '@kind other'` ra 0

Sau khi chạy driver: `ds-bundle/styles.css` phải có `@import "./tokens/tokens.css";`, và mục "## Tokens" của README không được có `--tw-`.

Lưu ý thêm:
- Thư mục tạm chứa CSS/JS build (ví dụ `dist-lib-old/` để so sánh) phải nằm trong `.gitignore` hoặc bị xoá trước `build:lib`. Tailwind v4 tự quét mọi file không bị ignore, nên thư mục như vậy sẽ thêm hàng chục utility thừa.
- Hai khối `:root`/`.dark` trong `index.css` nằm ngoài mọi `@layer`. Nếu sau này bọc chúng vào `@layer`, hoặc khai báo lại các biến này ở rule khác, phải xem lại plugin.
- README ghi "N CSS custom properties from .." vì `tokensPkg` là `..` (converter in nguyên tên). Không ảnh hưởng gì.

## Re-sync risks
- Class list in `src/design-system.css` is a manual allowlist: new tokens/utilities added to `index.css` or to the conventions must also be added there.
- `conventions.md` names tokens/classes from `docs/design-system.md`; re-validate against the fresh `tokens/tokens.css` + `_ds_bundle.css` after token changes.
- `.d.ts` are generated by `build-lib-types.mjs` (Base UI props come through from `@base-ui/react`, some doc comments are truncated by the converter).
- Dark mode (`.dark`) was not visually graded; previews were graded in light mode only.

- 2026-10-12: original project 2138b908 was deleted remotely (404); re-created as "KPI Performance" (92836757...) and pinned in config. Remote `templates/`/`screenshots/` note above applied to the old project only.

- 2026-10-13: re-sync after the i18n change. Run the driver with `--entry ./dist-lib/design-system.js --node-modules ./node_modules` (bare `--node-modules` alone fails: no `node_modules/frontend`). Shipped 17 components; new on the floor card (no authored preview yet): PageBanner, PageShell, TableCard, TableCardBar, TableCardBody (authorable on any re-sync). `conventions.md` language lines updated to English UI copy. `.design-sync/previews/*.tsx` still use Vietnamese sample text (not translated yet). Remote project also holds `templates/phan-quyen/` - outside the plan, never delete.

- 2026-10-13: re-sync after the "Today hub" login. Added authored previews (English copy) for InfoCard, ClockCard, CountdownCard, QuarterProgress, AnnouncementCard, UpdatesList (all `cardMode: column` except InfoCard); 23 components shipped, 0 bad. Playwright for the render check: `npm i playwright@1.63.0` inside `.ds-sync/` (pins chromium 1243, matching the cached browser; latest pins 1248 and fails to launch).
- CountdownCard previews are captured mid count-up (shows e.g. 72 instead of 79) — benign; the live card ends on the `days` prop. Still floor card: PageBanner, PageShell, TableCard, TableCardBar, TableCardBody.
- Known render warns: `[RENDER_THIN]` PageBanner (floor card), Toaster (portaled).
- Re-sync risk: the uploaded `ds-bundle` was built with no `--remote` (post-header rebuild rule); next re-sync fetches `_ds_sync.json` as usual.

- 2026-10-13: re-sync after the Permissions v2 page. `PageBanner` badges gained `onClick/active/dot/title` (clickable filter badges). The badge type is inlined in `PageBannerProps` (not a separate alias) because the converter's `.d.ts` emitter drops referenced local type aliases (it left a dangling `PageBannerBadge`). Still a floor card (no authored preview) so verification reported it `unchanged`; the bundle/`.d.ts` upload still shipped. 23 components, 0 bad. Atomic upload, 118 content files, nothing deleted; remote `templates/` untouched.

- 2026-10-16: added shell components (AppShell, AppSidebar, SidebarNavGroup/Item, SidebarToggle, AccountMenu/Avatar, Tooltip, Kbd, Dialog/ConfirmDialog, MetricCard/Eyebrow/Pill, TrendChart/Sparkline), tokens `shell`/`panel`, shadows `card`/`panel`/`nav`, animations `rise-in`/`bar-in`/`line-in` (all in the `@source inline` list). Not synced yet; no authored previews. Tooltip/AccountMenu/Dialog are portaled (likely `cardMode: single`).

- 2026-10-19: synced the 16 shell components with authored English previews (39 components; floor cards remain PageBanner, PageShell, TableCard*). Overlays: AccountMenu opens via `.click()` on mount, Tooltip via synthetic pointer/mouse enter events (`delay={0}`); Dialog/ConfirmDialog are `open` controlled. `cardMode: single` for AppShell (1120x600 - needs >=1024px for the `lg` layout), AppSidebar, AccountMenu, Dialog, ConfirmDialog, Tooltip; `column` for MetricCard, TrendChart. The AccountMenu wrapper needs `alignItems: flex-start`, otherwise the stretched trigger flips the menu upward and clips it. `conventions.md` gained the app-frame / dashboard / overlay bullets.
- Known render warns: `[RENDER_THIN]` Dialog, ConfirmDialog (portaled + fixed, height 0; screenshots correct) - benign. TrendChart/Sparkline review sheets catch the `line-in` draw animation mid-way (300ms delay + 1s); the live card completes - benign.

- 2026-10-19: `vite.lib.config.ts` có plugin `designSyncTokens` (chỉ cho build:lib) xử lý CSS thư viện sau khi build: bỏ khối dự phòng `*,:before,:after,::backdrop{--tw-*}` trong `@layer properties` (chỉ có tác dụng ở trình duyệt không hỗ trợ `@property`; giá trị khởi tạo đã có qua `@property`), và tách khối token ra `dist-lib/tokens/tokens.css` (xem mục "Yêu cầu bắt buộc cho token khi đồng bộ" ở trên). Mục đích: Claude Design hết báo "biến chưa đăng ký" / "token chưa phân loại". Token mới trong `index.css` được phân loại theo tên (`kindOf`); tên không theo quy ước nào sẽ rơi vào `other`, trừ khi giá trị là màu hoặc `var()` trỏ tới một token màu.
- Known render warns: `[TOKENS_MISSING]` (9 biến: `--available-height`, `--anchor-width`, `--transform-origin` do Base UI gán lúc chạy; `--tw-gradient-*-position`, `--tw-inset-shadow`, `--tw-inset-ring-shadow`… chỉ định nghĩa qua `@property`, sau khi đã bỏ khối dự phòng) - không ảnh hưởng hiển thị, render check vẫn sạch.

- 2026-10-19: pinned project 92836757 was gone remotely (404) — second time (see 2026-10-12). Re-created as "KPI Performance" (8615c890-4d9b-4bf8-9a50-05f33023132a), pinned in config, uploaded via the incremental path: 39 components (34 authored, all grades carried forward; floor: PageShell, TableCard, TableCardBar, TableCardBody), 198 content files + sentinel + `_ds_sync.json`. If `get_project` 404s again, check whether the project is being deleted on the claude.ai side before re-creating.

- 2026-10-19 (later): project 8615c890 was gone too (404, absent from `list_projects`) - the THIRD synced project lost (2138b908, 92836757, 8615c890), each within hours to days. User chose to re-create: "KPI Performance" (1e3f61d3-e159-49a8-8651-dd36f7b51407), pinned. Incremental path, nothing changed in the DS: 34 authored grades carried forward, render check 39/0 bad, 198 content files + sentinel + `_ds_sync.json`. Cause still unknown - if it 404s again, have the user check claude.ai (trash / workspace admin / retention policy) before re-creating a fourth.

- 2026-10-19: re-sync chỉ đổi định dạng CSS (khối token không nén, bỏ @kind khỏi `--tw-*`; ngữ nghĩa CSS không đổi). Driver: 39 unchanged, `upload.styling` only, render check 39/0 bad; atomic upload 198 file + sentinel + `_ds_sync.json`, không xoá gì. Dự án còn chứa `screens/kpi-proposal/` và `screenshots/` không do sync tạo — không bao giờ xoá.

- 2026-10-19: tokens tách sang `tokens/tokens.css` qua `tokensPkg`/`tokensGlob`; README token list từ 196 biến (gồm `--tw-*`) còn 162, không còn `--tw-*`. CSS tổng (tokens.css + _ds_bundle.css) giống hệt bản trước, chỉ đổi thứ tự (đã so). Render check 39/0 bad; 39 component unchanged.

- 2026-10-22: re-sync, atomic path, project 1e3f61d3. Driver: 39 unchanged, added AbcChip + DataGrid (user chose floor cards for now), `upload.components` also re-shipped AppShell/ConfirmDialog/FormAlert/Pill (.d.ts/.prompt.md changes), no deletes. Render check 41/0 bad; warns all already known. 207 content files + sentinel + `_ds_sync.json`. Synced from a working tree with uncommitted Permissions work (DataGrid density/hoverRows/fillEmpty, Checkbox, index.css) - by the user's choice.
- Floor card of AbcChip renders a single chip "0AbcChip" (crash-prevention props pass the name as `grade`) - not flagged bad but misleading; author `.design-sync/previews/AbcChip.tsx` (grades A/B/C, tones neutral/warning/danger) on the next sync. DataGrid floor card shows the typographic placeholder (`i3.cell is not a function` without columns) - author a preview with `columns` + `rows` (pinned columns, footer row, one variant with `groups`).
- Known render warns (unchanged): `[TOKENS_MISSING]` 9 vars; `[RENDER_THIN]` Dialog, ConfirmDialog, Toaster (portaled), PageBanner (floor card).
- Conventions drift (not rewritten - user's file): `conventions.md` line 3 says UI copy is English and never mixes Chinese/Vietnamese captions; the app now defaults to Vietnamese and allows Chinese column captions on the KPI/Promotion/Permissions tables (see CLAUDE.md i18n). DataGrid/AbcChip are not mentioned in the conventions yet. All other names in it still verify against the build.

- 2026-10-23: re-sync, atomic path, project 1e3f61d3. DataGrid changed (28px one-line group row, `subgroups` tier, `collapse.stub` vertical label; `DataGridSubgroup` type now exported from `design-system.ts`). Authored `.design-sync/previews/DataGrid.tsx` (PinnedWithTotal, GroupsSubgroupsCollapse, Comfortable - all graded good), `overrides.DataGrid = {cardMode: column}`. Driver: 40 unchanged + DataGrid; upload.components = DataGrid, bundle + styling, no deletes. Render check 41/0 bad. 208 content files + sentinel + `_ds_sync.json`. Remote `screens/` and `screenshots/` untouched.
- DataGrid preview: wrap in `TableCard` with a fixed height + `TableCardBody className="flex flex-col"` (DataGrid must be the direct child of the scroll box). Its card leaves empty space to the right of the groups cell (all px columns) - fine.
- Still floor cards: AbcChip (shows "0AbcChip"), PageBanner, PageShell, TableCard, TableCardBar, TableCardBody - authorable on any re-sync.
- Conventions drift unchanged (English-copy line, DataGrid/AbcChip not mentioned); name check against the build found only prose/prop-value false positives (`canh-bao`, `Jan`, `guidelines/design-system.md`).

- 2026-10-24: re-sync, atomic path, project 1e3f61d3, after commit fe981ff (full-window table pages). `TableCard` gained `fit`/`minRows` (measures the DataGrid via `data-slot="data-grid-row"`/`"data-grid-footer"` and sets its own min-height; `lg:shrink-[1000]`), `PageBanner` gained `compact` and is now `flex-none`. Driver: 41 unchanged, nothing to grade; upload.components = PageBanner, TableCard (+ bundle, styling, aux), no deletes. Render check 41/0 bad; warns all already known. 208 content files + sentinel + `_ds_sync.json`. Remote `screens/` and `screenshots/` untouched. `conventions.md` now names `TableCard fit` / `PageBanner compact` (verified in the `.d.ts` and `_ds_bundle.css`).
- The local `.design-sync/.cache/remote-sync.json` can go stale between syncs; if `ds-bundle/_ds_sync.json` matches the remote anchor (`bundleSha12`, `auxSha`, `styleSha`), copying it is equivalent to re-fetching.

- 2026-11-09: project 1e3f61d3 MOVED to Claude (`get_project` returns `moveState: moved`; uploads refused). At the user's explicit request a NEW project was created: "KPI Performance" (22a6d0ae-edfd-4d85-9d19-e8375543415d), pinned. It is separate from the moved copy (https://claude.ai/code/artifact/2cebc769-39f0-4ae0-96cf-a3e7c7fb11e9). Incremental path, 208 content files + sentinel + `_ds_sync.json`, 41 components (35 authored, floor: AbcChip, PageBanner, PageShell, TableCard, TableCardBar, TableCardBody), render check 41/0 bad.
- The app dropped the glass UI and is now the flat "soft blue" style + a navy dark mode. Its tokens were merged into the base `:root` / `.dark` blocks in `index.css` (previously scoped under `:root[data-ui="flat"]`, which the lib build would not apply - designs need no `data-ui` attribute). `.flat-backdrop` (page glow) and the 22px card / input / `.liquid-glass` flat rules ship unscoped in `_ds_bundle.css`.
- `build:lib` failed with `cần đúng 1 khối ":root"` because a leftover glass rule declared `--glass-rim` in a second top-level `:root`. Fixed by moving it into the main `:root`. Never add another top-level `:root`/`.dark` block - put new vars in the main ones.
- Sidebar previews (AppSidebar, SidebarNavGroup, SidebarNavItem, SidebarToggle) wrapped their content in `bg-shell` (the old near-black glass shell); switched to `flat-backdrop` and re-graded good. Styling changes never clear carried-forward grades, so after any palette change eyeball the contact sheets yourself - that is how this was caught.
- Conventions drift (user's file, not rewritten): `conventions.md` still says the app frame's "sidebar + header sit on `bg-shell`, content is the raised `bg-panel` sheet", and that `GlassCard` + gradient mesh are for login/welcome screens. Both are now wrong: sidebar/header sit on `.flat-backdrop`, content cards are white `bg-card` (22px), and login is flat too. The names still exist in the build, so nothing fails, but the design agent will copy the old glass look. Same open drift as before: "UI copy is English" vs the Vietnamese-default app.

## Re-sync risks (2026-11-09)
- Dark mode (navy `.dark`) was not visually graded - previews are captured in light mode only.
- Glass leftovers still ship in `_ds_bundle.css` (`.liquid-*`, `.shell-*`, `--panel`, `--shell`, `--glass-rim`, `--tab-gap-*` @property) and `GlassCard` is still exported. Harmless, but they inflate the CSS and tempt the design agent; remove them when the app code is cleaned up.
