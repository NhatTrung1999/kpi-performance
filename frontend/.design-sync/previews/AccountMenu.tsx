import * as React from 'react';
import { AccountMenu } from 'frontend';

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const SETTINGS = 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z';
const KEYBOARD = 'M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10';
const LOGOUT = 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9';

/** The menu opens on click; the preview clicks the avatar once on mount so the open state is visible. */
export const Open = () => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.querySelector('button')?.click();
  }, []);
  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', width: 340, height: 300, padding: 8 }}>
      <AccountMenu
        name="Linh Tran"
        initials="LT"
        title="Sales Manager"
        email="linh.tran@example.com"
        items={[
          { key: 'profile', label: 'Profile & settings', icon: <Icon d={SETTINGS} />, onSelect: () => {} },
          { key: 'shortcuts', label: 'Keyboard shortcuts', icon: <Icon d={KEYBOARD} />, shortcut: '?', onSelect: () => {} },
          { key: 'logout', label: 'Log out', icon: <Icon d={LOGOUT} />, tone: 'danger', separatorBefore: true, onSelect: () => {} },
        ]}
      />
    </div>
  );
};
