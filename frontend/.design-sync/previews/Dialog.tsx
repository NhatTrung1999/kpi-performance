import { Dialog, Kbd } from 'frontend';

const SHORTCUTS = [
  ['Collapse or expand the sidebar', 'Ctrl B'],
  ['Search goals and reviews', 'Ctrl K'],
  ['Show keyboard shortcuts', '?'],
  ['Close menus and dialogs', 'Esc'],
];

export const KeyboardShortcuts = () => (
  <Dialog open onOpenChange={() => {}} title="Keyboard shortcuts" description="Shortcuts work anywhere except while typing in a field." closeLabel="Close">
    <ul style={{ display: 'flex', flexDirection: 'column', listStyle: 'none', margin: 0, padding: 0 }}>
      {SHORTCUTS.map(([label, keys], i) => (
        <li key={keys} className={i ? 'border-t border-border' : undefined} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 0', fontSize: 14 }}>
          <span>{label}</span>
          <Kbd>{keys}</Kbd>
        </li>
      ))}
    </ul>
  </Dialog>
);
