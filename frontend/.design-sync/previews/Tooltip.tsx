import * as React from 'react';
import { Button, Tooltip } from 'frontend';

/** Tooltips open on hover/focus; the preview hovers the trigger once on mount so the popup is visible. */
function Hovered({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current?.querySelector('button');
    if (!el) return;
    for (const type of ['pointerenter', 'pointerover', 'mouseenter', 'mouseover', 'mousemove'])
      el.dispatchEvent(new (type.startsWith('pointer') ? PointerEvent : MouseEvent)(type, { bubbles: type.endsWith('over') || type === 'mousemove', pointerType: 'mouse' } as PointerEventInit));
  }, []);
  return <div ref={ref} style={{ width: 320, height: 120, display: 'flex', alignItems: 'center', paddingLeft: 24 }}>{children}</div>;
}

export const WithShortcut = () => (
  <Hovered>
    <Tooltip content="Collapse sidebar" shortcut="Ctrl B" delay={0}>
      <Button variant="outline">Sidebar</Button>
    </Tooltip>
  </Hovered>
);

export const Plain = () => (
  <Hovered>
    <Tooltip content="Notifications" side="right" delay={0}>
      <Button variant="outline">Bell</Button>
    </Tooltip>
  </Hovered>
);
