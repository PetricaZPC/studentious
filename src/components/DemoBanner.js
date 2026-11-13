import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const NOTICE =
  'Demo: sample data stored only in your browser (no account, no database). AI features (summaries, translation, audio, assistant) ' +
  'use free API keys that have probably expired, so the demo shows sample content instead.';

/** Small dismissible notice shown only to guests of the demo account. */
export default function DemoBanner() {
  const auth = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!auth?.user?.isDemo || dismissed) return null;

  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 12,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        maxWidth: 720,
        margin: '0 auto',
        padding: '10px 14px',
        borderRadius: 10,
        background: '#4c1d95',
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 1.4,
        boxShadow: '0 4px 18px rgba(0,0,0,0.25)',
      }}
    >
      <span style={{ flex: 1 }}>{NOTICE}</span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss demo notice"
        style={{ background: 'transparent', border: 0, color: '#ffffff', fontSize: 20, lineHeight: 1, cursor: 'pointer', minWidth: 32, minHeight: 32 }}
      >
        ×
      </button>
    </div>
  );
}
