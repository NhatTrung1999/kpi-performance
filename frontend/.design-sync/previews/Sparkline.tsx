import { Sparkline } from 'frontend';

const Cell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 200 }}>
    <span className="text-muted-foreground" style={{ fontSize: 12 }}>{label}</span>
    {children}
  </div>
);

export const Tones = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 200px)', gap: 28, padding: 8 }}>
    <Cell label="success (default)"><Sparkline values={[64, 66, 65, 69, 71, 70, 74, 78]} /></Cell>
    <Cell label="brand"><Sparkline values={[40, 52, 48, 61, 58, 66, 72, 70]} tone="brand" /></Cell>
    <Cell label="warning"><Sparkline values={[80, 78, 79, 75, 76, 72, 73, 71]} tone="warning" /></Cell>
    <Cell label="danger"><Sparkline values={[82, 80, 77, 78, 72, 69, 66, 61]} tone="danger" /></Cell>
  </div>
);
