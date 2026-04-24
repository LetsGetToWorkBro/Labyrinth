const BELT_COLORS: Record<string, string> = {
  white: '#EEEEEE', blue: '#1A5DAB', purple: '#6A1B9A',
  brown: '#6D4C2A', black: '#111111',
  grey: '#6B6B6B', gray: '#6B6B6B', yellow: '#C49B1A',
  orange: '#C4641A', green: '#2D8040'
};

const BELT_PATCH_COLORS: Record<string, string> = {
  black: '#CC0000',
  white: 'transparent',
};

export function BeltVisual({ belt, size = 'sm' }: { belt: string; size?: 'sm' | 'md' }) {
  const beltLower = (belt || '').toLowerCase();
  const color = BELT_COLORS[beltLower] || '#C8A24C';
  const patchColor = BELT_PATCH_COLORS[beltLower] || '#000';
  const showPatch = beltLower !== 'white';
  const h = size === 'sm' ? 9 : 13;
  const patchW = size === 'sm' ? 7 : 10;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, height: h, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ flex: 1, height: h, background: color }} />
      {showPatch && <div style={{ width: patchW, height: h, background: patchColor, flexShrink: 0 }} />}
      <div style={{ flex: 1, height: h, background: color }} />
    </div>
  );
}
