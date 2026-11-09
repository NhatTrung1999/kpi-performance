import { Avatar } from 'frontend';

export const Sizes = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
    <Avatar initials="LT" size="sm" />
    <Avatar initials="LT" size="md" />
    <Avatar initials="LT" size="lg" />
  </div>
);

export const WithName = () => (
  <div className="text-foreground" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Avatar initials="NH" size="lg" />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Nguyen Hoa</span>
      <span className="text-text-secondary" style={{ fontSize: 12 }}>HR Business Partner</span>
    </div>
  </div>
);
