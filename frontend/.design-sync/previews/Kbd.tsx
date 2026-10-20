import { Kbd } from 'frontend';

export const Keys = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Kbd>Ctrl B</Kbd>
    <Kbd>Ctrl K</Kbd>
    <Kbd>?</Kbd>
    <Kbd>Esc</Kbd>
  </div>
);

export const ShortcutList = () => (
  <ul className="text-foreground" style={{ width: 320, listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
    {[
      ['Collapse or expand the sidebar', 'Ctrl B'],
      ['Search goals and reviews', 'Ctrl K'],
      ['Show keyboard shortcuts', '?'],
    ].map(([label, keys], i) => (
      <li key={keys} className={i ? 'border-t border-border' : undefined} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <span>{label}</span>
        <Kbd>{keys}</Kbd>
      </li>
    ))}
  </ul>
);
