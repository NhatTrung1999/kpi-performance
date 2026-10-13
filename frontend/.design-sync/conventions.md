# KPI Performance design system — conventions

KPI / performance-review product. UI copy is **English** (the app serves text through i18n; new copy goes in English, never mix in Chinese/Vietnamese captions). Dates read `15 Jan 2015`, percentages `8.2%`. Font is **Be Vietnam Pro** (already loaded by `styles.css`; `font-sans` = `font-login` = Be Vietnam Pro).

## Setup
- No provider/wrapper component. Components are plain React; load `_ds_bundle.js` (global `window.KpiDS`) and `styles.css` (it imports `_ds_bundle.css`, which holds ALL tokens + Tailwind utilities).
- Dark mode = class `dark` on `<html>`. Every token flips automatically — **never write `dark:` variants for token classes**.
- `<Toaster />` goes once at the app root; call `toast.success/error/warning/info(...)` (from `KpiDS`) anywhere. Use `FormAlert` (not toast) for errors that must stay in a form.

## Styling idiom: Tailwind v4 utilities over semantic tokens
Use token classes only — never raw hex or `indigo-600`. Spacing is a 4px scale (`p-4`=16, `gap-6`=24). Class vocabulary (all exist in the shipped CSS):
- **Brand**: `bg-brand-gradient` (primary actions only), `bg-brand`, `ring-brand`, `text-brand-text` (links), `text-info`
- **Status** (green/amber/red mean status only): `bg-success|warning|danger`, soft fills `bg-success-soft|warning-soft|danger-soft`, text `text-success-text|warning-text|danger-text`, `text-danger-strong`, `border-danger-border`
- **Surfaces / text / borders**: `bg-page`, `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `text-foreground`, `text-text-secondary`, `text-muted-foreground`, `text-placeholder`, `border-border`, `border-border-strong`
- **Type scale**: `text-xs`(12) `text-label`(13) `text-sm`(14) `text-body`(15) `text-base` `text-title`(30) `text-3xl`; numbers always get `tabular-nums`
- **Radius**: `rounded-md|lg|xl|2xl`; `rounded-control` and `rounded-hero` and `bg-glass`/`border-glass-border`/`shadow-glass` are **login-screen only**
- **Shadow**: `shadow-brand`, `shadow-brand-hover`, `shadow-field`, `shadow-toast`, `shadow-glass(-sm)`; inner app pages prefer a `border-border` hairline, no shadow
- **Layout glue** (shipped, safe to use): spacing `p|px|py|pt|pb|pl|pr|m*|gap|gap-x|gap-y|space-x|space-y` × {0–8,10,12,14,16,20,24}; `grid`, `grid-cols-{1-6,12}` (+`sm:`/`md:`/`lg:`), `flex`, `flex-col|row|wrap|1`, `items-*`, `justify-*`, `w|h|size-{4…96}`, `w-full`, `max-w-{xs…7xl}`, `font-{normal|medium|semibold|bold}`, `text-{left|center|right}`, `border`, `truncate`. Other utilities are NOT guaranteed to exist — prefer a style attribute over inventing classes.
- Merge classes with `cn(...)` (exported from `KpiDS`).

## Design rules
- Inner pages (dashboards, forms): flat `Card`, no blur, no decorative gradient/animation. Brand colour only for the primary action. `GlassCard` + gradient mesh backgrounds are for login / welcome screens only.
- Status is never colour-alone: use `Badge status=…` (`dat` On track, `canh-bao` At risk, `chua-dat` Off track, `nhap` Draft, `cho-duyet` Pending review, `da-duyet` Approved — each has icon + English default label; pass `children` to override) and `StatCard` trend arrows.
- KPI colour thresholds (`ProgressBar`, `getKpiTone`): ≥90 success, 60–89 warning, <60 danger. Pass `StatCard trend.inverse` when a decrease is good (e.g. error rate).
- Form field = `Label` + `Input` (`aria-invalid` shows the error ring; `size="lg"` + `startIcon` is the login style).
- Dropdown/select-style menus: `Popover` + `PopoverTrigger` (`render={<Button variant="outline" />}`) + `PopoverContent` (portal to body, as wide as the trigger; add `style={{minWidth}}` for more) + `PopoverClose`. All exported from `KpiDS`; docs in `Popover.prompt.md`.
- Public / pre-login screens use the info cards `InfoCard`, `ClockCard`, `CountdownCard`, `QuarterProgress`, `AnnouncementCard`, `UpdatesList` (all exported from `KpiDS`; they animate in and respect `prefers-reduced-motion`). They take already-formatted text props — pass English copy — and must show public information only, never names or internal KPI data.
- Compose cards from `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` (all exported from `KpiDS`; docs live in `Card.prompt.md`).

## Where the truth lives
Read before styling: `styles.css` → `_ds_bundle.css` (token definitions in `:root` / `.dark`), `guidelines/design-system.md` (full token tables), and per-component `components/general/<Name>/<Name>.prompt.md` + `.d.ts`.

## Example
```jsx
const { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, StatCard, Badge, Button } = window.KpiDS;

<Card>
  <CardHeader>
    <CardTitle>KPI Q3 2026</CardTitle>
    <CardDescription>Sales Department</CardDescription>
    <CardAction><Badge status="canh-bao" /></CardAction>
  </CardHeader>
  <CardContent className="grid grid-cols-2 gap-4">
    <StatCard label="Revenue" value="12.4" unit="billion VND" trend={{ value: 8.2, caption: "vs. last quarter" }} progress={92} />
    <StatCard label="Error rate" value="1.8" unit="%" trend={{ value: -0.6, inverse: true }} progress={55} />
  </CardContent>
  <div className="flex justify-end gap-2 px-4 pb-4"><Button variant="outline">View details</Button><Button>Update</Button></div>
</Card>
```
