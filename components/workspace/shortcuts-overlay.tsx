'use client';

const SECTIONS: { title: string; items: [string, string[]][] }[] = [
  {
    title: 'Tools',
    items: [
      ['Select & move', ['S']],
      ['Bounding box', ['B']],
      ['Polygon', ['P']],
    ],
  },
  {
    title: 'Canvas',
    items: [
      ['Pan canvas', ['Space']],
      ['Deselect', ['Esc']],
    ],
  },
  {
    title: 'Edit',
    items: [
      ['Delete object', ['⌫']],
      ['Complete polygon', ['Enter']],
      ['Undo', ['⌘', 'Z']],
      ['Redo', ['⌘', '⇧', 'Z']],
    ],
  },
  {
    title: 'Help',
    items: [['Shortcuts', ['?']]],
  },
];

export function ShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="scrim open"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="dialog" style={{ maxWidth: 620 }}>
        <div className="kbd-modal-head">
          <h2 className="t-title" style={{ margin: 0 }}>Keyboard shortcuts</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="kbd-cols">
          {SECTIONS.map((sec) => (
            <div className="kbd-sec" key={sec.title}>
              <h4>{sec.title}</h4>
              {sec.items.map(([name, keys]) => (
                <div className="kbd-line" key={name}>
                  <span>{name}</span>
                  <span className="keys">
                    {keys.map((k, i) => <kbd className="key" key={i}>{k}</kbd>)}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
